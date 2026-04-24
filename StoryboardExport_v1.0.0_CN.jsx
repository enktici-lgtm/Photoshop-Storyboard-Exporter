// ====================================================
// 分镜导出 v1.0.0 (中文版)
// ====================================================
#target photoshop
app.preferences.rulerUnits = Units.PIXELS;

var TARGET_W = 1920;
var TARGET_H = 1080;
var TARGET_RATIO = TARGET_W / TARGET_H;
var JPG_QUALITY = 12;

var prefsFile = new File(Folder.myDocuments + "/StoryboardExportPrefs.json");

// ---------- 工具函数 ----------
function zeroPad(num, length) {
    var str = num.toString();
    while (str.length < length) str = "0" + str;
    return str;
}

function arrayContains(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === value) return true;
    }
    return false;
}

function loadPrefs() {
    try {
        if (prefsFile.exists) {
            var data = JSON.parse(prefsFile.read());
            return {
                outputFolder: data.outputFolder || "",
                startNumber: data.startNumber || "000",
                mode: data.mode || "vertical",
                offset: 0,
                processAllLayers: data.processAllLayers === undefined ? false : data.processAllLayers,
                regionSubCounts: data.regionSubCounts || [1,1,1,1,1],
                presets: data.presets || [
                    { name: "1080p (1920x1080)", w: 1920, h: 1080, subCounts: [1,1,1,1,1] },
                    { name: "4K (3840x2160)", w: 3840, h: 2160, subCounts: [1,1,1,1,1] },
                    { name: "Square (1080x1080)", w: 1080, h: 1080, subCounts: [1,1,1,1,1] }
                ],
                currentPresetIndex: data.currentPresetIndex || 0
            };
        }
    } catch (e) {}
    return {
        outputFolder: "",
        startNumber: "000",
        mode: "vertical",
        offset: 0,
        processAllLayers: false,
        regionSubCounts: [1,1,1,1,1],
        presets: [
            { name: "1080p (1920x1080)", w: 1920, h: 1080, subCounts: [1,1,1,1,1] },
            { name: "4K (3840x2160)", w: 3840, h: 2160, subCounts: [1,1,1,1,1] },
            { name: "Square (1080x1080)", w: 1080, h: 1080, subCounts: [1,1,1,1,1] }
        ],
        currentPresetIndex: 0
    };
}

function savePrefs(p) {
    p.offset = 0;
    try {
        prefsFile.open("w");
        prefsFile.write(JSON.stringify(p, null, 2));
        prefsFile.close();
    } catch (e) {}
}

function getGuides(direction) {
    var arr = [];
    var doc = app.activeDocument;
    if (!doc || !doc.guides) return arr;
    for (var i = 0; i < doc.guides.length; i++) {
        if (doc.guides[i].direction == direction)
            arr.push(doc.guides[i].coordinate.value);
    }
    arr.sort(function(a,b){return a-b;});
    return arr;
}

function incrementName(name) {
    var match = name.match(/^(.*?)(\d+)$/);
    if (match) {
        var prefix = match[1];
        var numStr = match[2];
        var num = parseInt(numStr, 10);
        return prefix + zeroPad(num + 1, numStr.length);
    }
    return name + "_1";
}

function parseContinuity(layerName) {
    var match = layerName.match(/\[cont:([^\]]+)\]/i);
    if (!match) return [];
    var parts = match[1].split(/,|，/);
    var list = [];
    for (var i = 0; i < parts.length; i++) {
        var num = parseInt(parts[i]);
        if (!isNaN(num) && num > 1) list.push(num);
    }
    return list;
}

// ---------- 构建对话框 ----------
function buildDialog(prefs) {
    var dlg = new Window("dialog", "分镜导出设置 v1.0.0");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.spacing = 8;
    dlg.margins = 12;

    // 预设
    var grpPreset = dlg.add("group");
    grpPreset.add("statictext", undefined, "预设:");
    var ddPreset = grpPreset.add("dropdownlist");
    for (var i = 0; i < prefs.presets.length; i++) {
        ddPreset.add("item", prefs.presets[i].name);
    }
    ddPreset.selection = prefs.currentPresetIndex || 0;

    // 分辨率
    var grpRes = dlg.add("group");
    grpRes.add("statictext", undefined, "输出尺寸:");
    var txtW = grpRes.add("edittext", undefined, prefs.presets[ddPreset.selection.index].w.toString());
    txtW.characters = 5;
    var lblX = grpRes.add("statictext", undefined, "x");
    var txtH = grpRes.add("edittext", undefined, prefs.presets[ddPreset.selection.index].h.toString());
    txtH.characters = 5;
    var lblPx = grpRes.add("statictext", undefined, "px");

    // 输出文件夹
    var grp1 = dlg.add("group");
    grp1.alignment = "left";
    grp1.add("statictext", undefined, "输出文件夹:");
    var txtFolder = grp1.add("edittext", undefined, prefs.outputFolder);
    txtFolder.characters = 30;
    var btnFolder = grp1.add("button", undefined, "选择...");
    btnFolder.onClick = function() {
        var f = Folder.selectDialog("选择输出文件夹");
        if (f) txtFolder.text = f.fsName;
    };

    // 起始编号
    var grp2 = dlg.add("group");
    grp2.add("statictext", undefined, "起始编号:");
    var txtStart = grp2.add("edittext", undefined, prefs.startNumber);
    txtStart.characters = 10;

    // 裁剪模式
    var grp3 = dlg.add("group");
    grp3.add("statictext", undefined, "裁剪基准:");
    var rbVert = grp3.add("radiobutton", undefined, "垂直优先（左右固定，上下居中）");
    var rbHorz = grp3.add("radiobutton", undefined, "水平优先（上下固定，左右居中）");
    if (prefs.mode == "horizontal") rbHorz.value = true; else rbVert.value = true;

    // 图层范围
    var grpLayer = dlg.add("group");
    grpLayer.add("statictext", undefined, "图层范围:");
    var ddLayers = grpLayer.add("dropdownlist");
    ddLayers.add("item", "仅当前可见图层（手动控制）");
    ddLayers.add("item", "所有图层（逐层自动处理）");
    ddLayers.selection = prefs.processAllLayers ? 1 : 0;

    // 区域面板
    var regionPanel = dlg.add("panel");
    regionPanel.alignChildren = "fill";
    regionPanel.orientation = "column";
    regionPanel.spacing = 4;
    regionPanel.text = "水平区域（子镜头数）";
    var regionGroup = regionPanel.add("group");
    regionGroup.orientation = "column";
    regionGroup.alignChildren = "fill";
    var btnRefresh = regionPanel.add("button", undefined, "刷新区域");
    var regionInputs = [];
    var previewText = null;

    var helpBtn = regionPanel.add("button", undefined, "💡 如何标记连续镜头？");

    function updatePreview() {
        if (!previewText) return;
        var total = 0;
        for (var k = 0; k < regionInputs.length; k++) {
            var val = parseInt(regionInputs[k].text);
            if (!isNaN(val) && val > 0) total += val;
        }
        previewText.text = "预计导出总数: " + total;
    }

    function loadPresetSubCounts(index) {
        var preset = prefs.presets[index];
        if (preset && preset.subCounts) {
            for (var i = 0; i < regionInputs.length; i++) {
                if (i < preset.subCounts.length) {
                    regionInputs[i].text = preset.subCounts[i].toString();
                }
            }
            updatePreview();
        }
    }

    ddPreset.onChange = function() {
        var idx = ddPreset.selection.index;
        var preset = prefs.presets[idx];
        txtW.text = preset.w.toString();
        txtH.text = preset.h.toString();
        loadPresetSubCounts(idx);
    };

    function fillRegions() {
        while (regionGroup.children.length > 0) regionGroup.children[0].remove();
        regionInputs = [];
        var hGuides = getGuides(Direction.HORIZONTAL);
        if (hGuides.length < 2) {
            regionGroup.add("statictext", undefined, "（未检测到水平参考线）");
            dlg.layout.layout(true);
            return;
        }
        var regionCount = 0;
        var defSub = [1,1,1,1,1];
        if (ddPreset.selection && prefs.presets[ddPreset.selection.index]) {
            var preset = prefs.presets[ddPreset.selection.index];
            if (preset.subCounts) defSub = preset.subCounts;
        }
        for (var i = 0; i < hGuides.length - 1; i++) {
            var y1 = hGuides[i], y2 = hGuides[i+1];
            if (Math.abs(y2 - y1) < 0.5) continue;
            var row = regionGroup.add("group");
            row.orientation = "row";
            row.spacing = 6;
            row.add("statictext", undefined, "区域"+(regionCount+1)+" ("+Math.round(y1)+"-"+Math.round(y2)+") 子镜头数:");
            var ed = row.add("edittext", undefined, (defSub[regionCount] || 1).toString());
            ed.characters = 3;
            ed.onChange = updatePreview;
            regionInputs.push(ed);
            regionCount++;
        }
        var previewRow = regionGroup.add("group");
        previewRow.alignment = "right";
        previewText = previewRow.add("statictext", undefined, "预计导出总数: 0");
        updatePreview();
        dlg.layout.layout(true);
    }

    btnRefresh.onClick = fillRegions;

    helpBtn.onClick = function() {
        alert("连续镜头标记方法：\n\n" +
              "在图层名称末尾添加 [cont:区域号]\n" +
              "例：场景1 [cont:3,4]\n" +
              "表示区域3与区域4是同一个镜头的连续拍摄。\n\n" +
              "导出时，区域3将作为主编号递增（如 002），\n" +
              "区域4将共享该主编号，并自动生成子编号。\n" +
              "最终文件：001, 002-01, 002-02, 003...", "连续镜头帮助");
    };

    var grpBtn = dlg.add("group");
    grpBtn.alignment = "center";
    var btnOK = grpBtn.add("button", undefined, "开始导出");
    var btnCancel = grpBtn.add("button", undefined, "取消");

    fillRegions();
    if (ddPreset.selection) loadPresetSubCounts(ddPreset.selection.index);

    btnOK.onClick = function() {
        prefs.outputFolder = txtFolder.text;
        prefs.startNumber = txtStart.text;
        prefs.mode = rbVert.value ? "vertical" : "horizontal";
        prefs.processAllLayers = ddLayers.selection.index == 1;

        var subCounts = [];
        for (var i = 0; i < regionInputs.length; i++) {
            var v = parseInt(regionInputs[i].text);
            subCounts.push(isNaN(v) || v < 0 ? 1 : v);
        }
        prefs.regionSubCounts = subCounts;

        var wVal = parseInt(txtW.text);
        var hVal = parseInt(txtH.text);
        if (!isNaN(wVal) && !isNaN(hVal) && wVal > 0 && hVal > 0) {
            var idx = ddPreset.selection.index;
            prefs.presets[idx].w = wVal;
            prefs.presets[idx].h = hVal;
            prefs.presets[idx].subCounts = subCounts;
        }
        prefs.currentPresetIndex = ddPreset.selection.index;
        savePrefs(prefs);
        dlg.close(1);
    };
    btnCancel.onClick = function() { dlg.close(0); };
    return dlg;
}

// ---------- 导出单个画框 ----------
function exportSingleRegion(originalDoc, targetLayer, left, top, right, bottom, fileName, outputFolder, targetW, targetH) {
    var tempDoc = originalDoc.duplicate();
    var layerFound = false;
    for (var i = 0; i < tempDoc.artLayers.length; i++) {
        var layer = tempDoc.artLayers[i];
        if (layer.name === targetLayer.name) {
            layer.visible = true;
            layerFound = true;
        } else {
            layer.visible = false;
        }
    }
    if (!layerFound) {
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        throw new Error("在临时文档中未找到图层: " + targetLayer.name);
    }

    tempDoc.crop([new UnitValue(left,"px"), new UnitValue(top,"px"), new UnitValue(right,"px"), new UnitValue(bottom,"px")]);
    tempDoc.resizeImage(UnitValue(targetW,"px"), UnitValue(targetH,"px"), null, ResampleMethod.BICUBIC);

    var file = new File(outputFolder + "/" + fileName + ".jpg");
    if (file.exists) {
        var choice = confirm(fileName + ".jpg 已存在。\n是: 覆盖 | 否: 跳过 | 取消: 终止全部",
                              false, "文件冲突");
        if (choice === false) {
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
            return false;
        } else if (choice == 2) {
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
            throw new Error("用户终止导出");
        }
    }

    var jpgOpt = new JPEGSaveOptions();
    jpgOpt.quality = JPG_QUALITY;
    tempDoc.saveAs(file, jpgOpt, true);
    tempDoc.close(SaveOptions.DONOTSAVECHANGES);
    return true;
}

// ---------- 主流程 ----------
try {
    var doc = app.activeDocument;
    if (!doc) throw new Error("请先打开分镜文档。");

    var prefs = loadPrefs();
    var dlg = buildDialog(prefs);
    if (dlg.show() != 1) throw new Error("用户取消");

    var startTime = new Date().getTime();

    var targetW = TARGET_W;
    var targetH = TARGET_H;
    if (prefs.currentPresetIndex !== undefined && prefs.presets[prefs.currentPresetIndex]) {
        targetW = prefs.presets[prefs.currentPresetIndex].w;
        targetH = prefs.presets[prefs.currentPresetIndex].h;
    }
    var targetRatio = targetW / targetH;

    if (!prefs.outputFolder) throw new Error("请指定输出文件夹。");
    var outFolder = new Folder(prefs.outputFolder);
    if (!outFolder.exists) outFolder.create();

    var hGuides = getGuides(Direction.HORIZONTAL);
    var vGuides = getGuides(Direction.VERTICAL);
    if (hGuides.length < 2) throw new Error("请至少拉两条水平参考线来定义区域。");

    var layersToProcess = [];
    if (prefs.processAllLayers) {
        for (var i = 0; i < doc.artLayers.length; i++) {
            layersToProcess.push(doc.artLayers[i]);
        }
    } else {
        for (var i = 0; i < doc.artLayers.length; i++) {
            if (doc.artLayers[i].visible) layersToProcess.push(doc.artLayers[i]);
        }
    }
    if (layersToProcess.length === 0) throw new Error("未找到可处理的图层。请确保有可见图层。");

    var logArray = [];
    var subCounts = prefs.regionSubCounts;

    for (var l = 0; l < layersToProcess.length; l++) {
        var srcLayer = layersToProcess[l];
        var currentMainName = prefs.startNumber;
        var subIndex = 0;
        var regionIndex = 0;
        var prevCont = false;

        var continuityList = parseContinuity(srcLayer.name);

        for (var i = 0; i < hGuides.length - 1; i++) {
            var y1 = hGuides[i], y2 = hGuides[i+1];
            if (Math.abs(y2 - y1) < 0.5) continue;
            if (regionIndex >= subCounts.length) break;
            var sub = subCounts[regionIndex];
            var regionNum = regionIndex + 1;
            var isCont = arrayContains(continuityList, regionNum);

            if (sub <= 0) {
                regionIndex++;
                prevCont = isCont;
                continue;
            }

            // 编号递增逻辑
            if (regionIndex === 0) {
            } else if (isCont && !prevCont) {
                currentMainName = incrementName(currentMainName);
                subIndex = 0;
            } else if (!isCont) {
                currentMainName = incrementName(currentMainName);
                subIndex = 0;
            }

            // 计算裁剪坐标
            var left, top, right, bottom;
            if (prefs.mode == "vertical") {
                left  = vGuides.length >= 2 ? vGuides[0] : 0;
                right = vGuides.length >= 2 ? vGuides[vGuides.length-1] : doc.width.value;
                var w = right - left;
                var h = w / targetRatio;
                var cy = (y1 + y2) / 2;
                top = cy - h/2;
                bottom = cy + h/2;
                if (top < 0)      { bottom -= top; top = 0; }
                if (bottom > doc.height.value) { top -= (bottom - doc.height.value); bottom = doc.height.value; }
            } else {
                top = y1;
                bottom = y2;
                var h = bottom - top;
                var w = h * targetRatio;
                var vLeft  = vGuides.length >= 2 ? vGuides[0] : 0;
                var vRight = vGuides.length >= 2 ? vGuides[vGuides.length-1] : doc.width.value;
                var vWidth = vRight - vLeft;
                left = vLeft + (vWidth - w) / 2;
                right = left + w;
                if (left < vLeft)      { right -= (left - vLeft); left = vLeft; }
                if (right > vRight)    { left -= (right - vRight); right = vRight; }
            }

            // 生成文件名
            for (var v = 0; v < sub; v++) {
                var fullFileName;
                if (isCont) {
                    subIndex++;
                    fullFileName = currentMainName + "-" + zeroPad(subIndex, 2);
                } else {
                    if (sub > 1) {
                        fullFileName = currentMainName + "-" + zeroPad(v + 1, 2);
                    } else {
                        fullFileName = currentMainName;
                    }
                }

                var exportSuccess = false;
                try {
                    exportSuccess = exportSingleRegion(doc, srcLayer, left, top, right, bottom,
                                                       fullFileName, prefs.outputFolder, targetW, targetH);
                } catch (e) {
                    alert("导出 " + fullFileName + " 时出错: " + e.toString());
                }
                if (exportSuccess) {
                    logArray.push("[" + srcLayer.name + "] 区域" + regionNum + "-" + fullFileName + ".jpg");
                }
            }

            prevCont = isCont;
            regionIndex++;
        }
    }

    var endTime = new Date().getTime();
    var duration = ((endTime - startTime) / 1000).toFixed(1);

    if (logArray.length > 0) {
        var logFile = new File(prefs.outputFolder + "/export_log.txt");
        logFile.open("a");
        logFile.writeln("=== " + new Date().toString() + " ===");
        for (var i = 0; i < logArray.length; i++) logFile.writeln(logArray[i]);
        logFile.close();
    }

    alert("导出完成！\n共处理图层: " + layersToProcess.length +
          "\n输出文件: " + logArray.length +
          "\n耗时: " + duration + " 秒" +
          "\n保存在：" + prefs.outputFolder);
} catch (e) {
    alert("脚本中断: " + e.toString());
}
