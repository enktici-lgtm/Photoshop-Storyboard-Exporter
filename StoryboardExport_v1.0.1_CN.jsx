// ====================================================
// 分镜导出 v1.0.1 (中文版) - 轻量级模块化重构
// 模块结构:
//   - ConfigModule: 配置管理 (加载/保存prefs)
//   - UtilsModule: 工具函数 (编号、数组、图层处理)
//   - UIModule: 界面构建 (对话框、窗口)
//   - ExportModule: 导出逻辑 (单文件导出、批量导出)
//   - MainModule: 主流程 (入口、协调各模块)
// ====================================================
#target photoshop
app.preferences.rulerUnits = Units.PIXELS;

// ====================================================
// 模块1: 配置管理 (ConfigModule)
// ====================================================
var ConfigModule = {
    // 全局常量
    EXPORT_FORMATS: {
        JPG: "JPG",
        PNG: "PNG",
        WEBP: "WebP"
    },
    
    JPG_QUALITY: 12,
    TARGET_W: 1920,
    TARGET_H: 1080,
    
    prefsFile: new File(Folder.myDocuments + "/StoryboardExportPrefs.json"),
    
    // 加载配置
    loadPrefs: function() {
        try {
            if (this.prefsFile.exists) {
                var data = JSON.parse(this.prefsFile.read());
                return {
                    outputFolder: data.outputFolder || "",
                    startNumber: data.startNumber || "001",
                    mode: data.mode || "vertical",
                    processAllLayers: data.processAllLayers === undefined ? false : data.processAllLayers,
                    layerContinuity: data.layerContinuity || [],
                    skipExisting: data.skipExisting === undefined ? false : data.skipExisting,
                    exportFormat: data.exportFormat || this.EXPORT_FORMATS.JPG,
                    presets: data.presets || [
                        { name: "1080p (1920x1080)", w: 1920, h: 1080 },
                        { name: "4K (3840x2160)", w: 3840, h: 2160 },
                        { name: "Square (1080x1080)", w: 1080, h: 1080 }
                    ],
                    currentPresetIndex: data.currentPresetIndex || 0
                };
            }
        } catch (e) {}
        return {
            outputFolder: "",
            startNumber: "001",
            mode: "vertical",
            processAllLayers: false,
            layerContinuity: [],
            skipExisting: false,
            exportFormat: this.EXPORT_FORMATS.JPG,
            presets: [
                { name: "1080p (1920x1080)", w: 1920, h: 1080 },
                { name: "4K (3840x2160)", w: 3840, h: 2160 },
                { name: "Square (1080x1080)", w: 1080, h: 1080 }
            ],
            currentPresetIndex: 0
        };
    },
    
    // 保存配置
    savePrefs: function(p) {
        try {
            this.prefsFile.open("w");
            this.prefsFile.write(JSON.stringify(p, null, 2));
            this.prefsFile.close();
        } catch (e) {}
    }
};

// ====================================================
// 模块2: 工具函数 (UtilsModule)
// ====================================================
var UtilsModule = {
    // 数字补零
    zeroPad: function(num, length) {
        var str = num.toString();
        while (str.length < length) str = "0" + str;
        return str;
    },
    
    // 数组包含检查
    arrayContains: function(arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) return true;
        }
        return false;
    },
    
    // 递增编号
    incrementName: function(name) {
        var match = name.match(/^(.*?)(\d+)$/);
        if (match) {
            var prefix = match[1];
            var numStr = match[2];
            var num = parseInt(numStr, 10);
            return prefix + this.zeroPad(num + 1, numStr.length);
        }
        return name + "_1";
    },
    
    // 从图层名解析连续性信息
    parseContinuity: function(layerName) {
        var match = layerName.match(/\[cont:([^\]]+)\]/i);
        if (!match) return [];
        var parts = match[1].split(/,|，/);
        var list = [];
        for (var i = 0; i < parts.length; i++) {
            var num = parseInt(parts[i]);
            if (!isNaN(num) && num > 1) list.push(num);
        }
        return list;
    },
    
    // 获取参考线
    getGuides: function(direction) {
        var arr = [];
        var doc = app.activeDocument;
        if (!doc || !doc.guides) return arr;
        for (var i = 0; i < doc.guides.length; i++) {
            if (doc.guides[i].direction == direction)
                arr.push(doc.guides[i].coordinate.value);
        }
        arr.sort(function(a,b){return a-b;});
        return arr;
    },
    
    // 获取所有可见图层（包括图层组中的图层）
    getAllVisibleLayers: function(doc) {
        var layers = [];
        
        var self = this;
        function traverseLayers(layerSet) {
            for (var i = 0; i < layerSet.layers.length; i++) {
                var layer = layerSet.layers[i];
                if (layer.typename === "LayerSet") {
                    // 递归处理图层组
                    if (layer.visible) {
                        traverseLayers(layer);
                    }
                } else if (layer.visible) {
                    // 普通图层
                    layers.push(layer);
                }
            }
        }
        
        traverseLayers(doc);
        return layers;
    },
    
    // 生成文件名列表（预览和导出共用）
    generateFileNames: function(doc, layersToProcess, regionCount, continuityData, startNumber) {
        var subCounts = [];
        for (var r = 0; r < regionCount; r++) {
            subCounts.push(1);
        }

        var globalMainName = startNumber;
        var globalSubIndex = 0;
        var prevLayerLastRegionWasCont = false;
        var fileNames = [];

        // 创建图层索引映射
        var layerIndexMap = [];
        for (var l = 0; l < layersToProcess.length; l++) {
            for (var i = 0; i < doc.artLayers.length; i++) {
                if (doc.artLayers[i].name === layersToProcess[l].name) {
                    layerIndexMap.push(i);
                    break;
                }
            }
        }

        for (var l = 0; l < layersToProcess.length; l++) {
            var layer = layersToProcess[l];
            var origIndex = layerIndexMap[l];
            
            var contList = [];
            if (continuityData && continuityData[origIndex]) {
                for (var r = 0; r < continuityData[origIndex].length; r++) {
                    if (r < regionCount && continuityData[origIndex][r]) contList.push(r+1);
                }
            }
            if (contList.length == 0) contList = this.parseContinuity(layer.name);

            var currentMainName = globalMainName;
            var subIdx = globalSubIndex;
            var prevContInLayer = false;

            for (var i = 0; i < regionCount; i++) {
                if (i >= subCounts.length) break;
                var sub = subCounts[i];
                var isCont = this.arrayContains(contList, i+1);

                if (sub <= 0) { 
                    prevContInLayer = isCont; 
                    continue; 
                }

                // 核心编号逻辑
                if (i === 0) {
                    if (l > 0) {
                        if (prevLayerLastRegionWasCont && isCont) {
                            // 保持主编号，子编号继续
                        } else {
                            currentMainName = this.incrementName(currentMainName);
                            subIdx = 0;
                        }
                    } else {
                        subIdx = 0;
                    }
                } else {
                    if (!isCont && !prevContInLayer) {
                        currentMainName = this.incrementName(currentMainName);
                        subIdx = 0;
                    } else if (isCont && !prevContInLayer) {
                        currentMainName = this.incrementName(currentMainName);
                        subIdx = 0;
                    } else if (!isCont && prevContInLayer) {
                        currentMainName = this.incrementName(currentMainName);
                        subIdx = 0;
                    } else if (isCont && prevContInLayer) {
                        // 保持主编号，子编号继续
                    }
                }

                for (var v = 0; v < sub; v++) {
                    var fname;
                    if (isCont) {
                        subIdx++;
                        fname = currentMainName + "-" + this.zeroPad(subIdx, 2);
                    } else {
                        if (sub > 1) {
                            fname = currentMainName + "-" + this.zeroPad(v+1, 2);
                        } else {
                            fname = currentMainName;
                        }
                    }
                    fileNames.push(fname);
                }

                prevContInLayer = isCont;
            }

            globalMainName = currentMainName;
            globalSubIndex = subIdx;
            prevLayerLastRegionWasCont = prevContInLayer;
        }

        return fileNames;
    }
};

// ---------- 构建对话框 ----------
function buildDialog(prefs) {
    var dlg = new Window("dialog", "分镜导出设置 v1.0.1");
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

    ddPreset.onChange = function() {
        var idx = ddPreset.selection.index;
        txtW.text = prefs.presets[idx].w.toString();
        txtH.text = prefs.presets[idx].h.toString();
    };

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

    // ==================== 图层管理功能区====================
    var mgmtPanel = dlg.add("panel");
    mgmtPanel.alignChildren = "fill";
    mgmtPanel.orientation = "column";
    mgmtPanel.spacing = 6;
    mgmtPanel.text = "图层管理";

    // 状态提示
    var contStatusText = mgmtPanel.add("statictext", undefined, "已设置连续镜头: 0 个图层");
    function updateContStatus() {
        var count = 0;
        if (prefs.layerContinuity) {
            for (var i = 0; i < prefs.layerContinuity.length; i++) {
                if (prefs.layerContinuity[i]) {
                    for (var j = 0; j < prefs.layerContinuity[i].length; j++) {
                        if (prefs.layerContinuity[i][j]) { count++; break; }
                    }
                }
            }
        }
        contStatusText.text = "已设置连续镜头: " + count + " 个图层";
    }
    updateContStatus();

    var btnRow = mgmtPanel.add("group");
    btnRow.orientation = "row";
    btnRow.spacing = 10;

// 连续镜头设置按钮
var btnCont = btnRow.add("button", undefined, "🔗 连续镜头");
btnCont.onClick = function() {
    try {
        var doc = app.activeDocument;
        if (!doc) { 
            alert("请先打开文档。"); 
            return; 
        }
        
        var layers = doc.artLayers;
        if (layers.length == 0) { 
            alert("当前文档没有图层。"); 
            return; 
        }

        var hGuides = UtilsModule.getGuides(Direction.HORIZONTAL);
        if (hGuides.length < 2) { 
            alert("请至少拉两条水平参考线来定义区域。"); 
            return; 
        }
        
        var regionCount = hGuides.length - 1;

        // 确保连续性数据结构存在且大小足够 - 保留已有数据，只扩展不足的部分
        if (!prefs.layerContinuity) {
            prefs.layerContinuity = [];
        }
        
        // 为每个图层确保有足够的区域数组
        for (var i = 0; i < layers.length; i++) {
            if (!prefs.layerContinuity[i]) {
                prefs.layerContinuity[i] = [];
            }
            while (prefs.layerContinuity[i].length < regionCount) {
                prefs.layerContinuity[i].push(false);
            }
            if (prefs.layerContinuity[i].length > regionCount) {
                prefs.layerContinuity[i] = prefs.layerContinuity[i].slice(0, regionCount);
            }
        }

        // 创建窗口 - 增加高度确保所有元素可见
        var contWin = new Window("dialog", "设置连续镜头");
        contWin.orientation = "column";
        contWin.alignChildren = ["fill", "top"];
        contWin.spacing = 5;
        contWin.margins = 8;
        contWin.preferredSize = [680, 520];
        contWin.maximumSize = [680, 520];

        // 说明文字 - 添加实时保存提示
        var infoText = contWin.add("statictext", undefined, 
            "✓ 选择即时保存 | 勾选表示该图层的对应区域与下一张图连续（编号不递增）");
        infoText.alignment = "left";
        infoText.graphics.font = ScriptUI.newFont(infoText.graphics.font.name, ScriptUI.FontStyle.BOLD, 10);
        infoText.graphics.foregroundColor = infoText.graphics.newPen(infoText.graphics.PenType.SOLID_COLOR, [0.3, 0.8, 0.3], 1);

        // 副提示
        var subInfoText = contWin.add("statictext", undefined, 
            "提示：勾选后自动保存，按ESC或点击关闭按钮均可");
        subInfoText.alignment = "left";
        subInfoText.graphics.font = ScriptUI.newFont(subInfoText.graphics.font.name, ScriptUI.FontStyle.REGULAR, 9);
        subInfoText.graphics.foregroundColor = subInfoText.graphics.newPen(subInfoText.graphics.PenType.SOLID_COLOR, [0.7, 0.7, 0.7], 1);

        // 表头组
        var headerGroup = contWin.add("group");
        headerGroup.orientation = "row";
        headerGroup.alignment = "fill";
        headerGroup.spacing = 3;
        headerGroup.margins = [2, 1, 2, 1];
        
        var layerNameHeader = headerGroup.add("statictext", undefined, "图层名称");
        layerNameHeader.preferredSize = [200, 18];
        layerNameHeader.graphics.font = ScriptUI.newFont(layerNameHeader.graphics.font.name, ScriptUI.FontStyle.BOLD, 10);
        
        for (var r = 0; r < regionCount; r++) {
            var regionHeader = headerGroup.add("statictext", undefined, "区域" + (r+1));
            regionHeader.preferredSize = [65, 18];
            regionHeader.justify = "center";
            regionHeader.graphics.font = ScriptUI.newFont(regionHeader.graphics.font.name, ScriptUI.FontStyle.BOLD, 10);
        }

        // 内容面板 - 使用 maximumSize 强制限制高度，增加高度以容纳10个图层
        var contentPanel = contWin.add("panel");
        contentPanel.alignment = "fill";
        contentPanel.alignChildren = ["top", "top"];  // 改为 top 对齐
        contentPanel.margins = [1, 1, 1, 1];
        contentPanel.preferredSize = [660, 300];
        contentPanel.maximumSize = [660, 300];

        // 存储所有复选框的数据（不是控件引用）
        var currentPage = 0;
        var pageSize = 10;
        var totalPages = Math.ceil(layers.length / pageSize);
        var currentRowGroups = [];  // 当前页的行控件

        // 显示指定页的图层
        function showPage(pageIndex) {
            // 清除当前面板的所有内容
            while (contentPanel.children.length > 0) {
                contentPanel.remove(contentPanel.children[0]);
            }
            currentRowGroups = [];

            // 计算当前页的范围
            var startIndex = pageIndex * pageSize;
            var endIndex = Math.min(startIndex + pageSize, layers.length);

            // 创建当前页的行
            for (var i = startIndex; i < endIndex; i++) {
                var rowGroup = contentPanel.add("group");
                rowGroup.orientation = "row";
                rowGroup.alignment = "fill";
                rowGroup.spacing = 3;
                rowGroup.margins = [2, 1, 2, 1];
                
                // 图层名称标签
                var layerLabel = rowGroup.add("statictext", undefined, (i+1) + ". " + layers[i].name);
                layerLabel.preferredSize = [200, 18];
                layerLabel.truncateCharacters = 28;
                layerLabel.graphics.font = ScriptUI.newFont(layerLabel.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
                
                // 为每个区域创建复选框
                for (var r = 0; r < regionCount; r++) {
                    var chk = rowGroup.add("checkbox", undefined, "");
                    chk.preferredSize = [65, 18];
                    chk.value = prefs.layerContinuity[i][r];
                    
                    // 直接绑定到数据源
                    (function(layerIdx, regionIdx, checkbox) {
                        checkbox.onClick = function() {
                            prefs.layerContinuity[layerIdx][regionIdx] = checkbox.value;
                        };
                    })(i, r, chk);
                }
                
                currentRowGroups.push(rowGroup);
            }

            // 更新页码显示
            pageNum.text = (pageIndex + 1) + " / " + totalPages;
            
            // 更新按钮状态
            btnPrev.enabled = (pageIndex > 0);
            btnNext.enabled = (pageIndex < totalPages - 1);
            
            // 强制刷新布局
            contWin.layout.layout(true);
            contWin.layout.resize();
        }

        // 翻页控制区域
        var pageControl = contWin.add("group");
        pageControl.orientation = "row";
        pageControl.alignment = "center";
        pageControl.spacing = 6;
        pageControl.margins = [0, 3, 0, 3];

        var btnPrev = pageControl.add("button", undefined, "◀ 上一页");
        btnPrev.preferredSize = [80, 22];
        btnPrev.graphics.font = ScriptUI.newFont(btnPrev.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);
        
        var pageNum = pageControl.add("statictext", undefined, "1 / " + totalPages);
        pageNum.preferredSize = [55, 20];
        pageNum.justify = "center";
        pageNum.graphics.font = ScriptUI.newFont(pageNum.graphics.font.name, ScriptUI.FontStyle.BOLD, 11);
        
        var btnNext = pageControl.add("button", undefined, "下一页 ▶");
        btnNext.preferredSize = [80, 22];
        btnNext.graphics.font = ScriptUI.newFont(btnNext.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);

        // 翻页按钮事件
        btnPrev.onClick = function() {
            if (currentPage > 0) {
                currentPage--;
                showPage(currentPage);
            }
        };

        btnNext.onClick = function() {
            if (currentPage < totalPages - 1) {
                currentPage++;
                showPage(currentPage);
            }
        };

        // 初始化显示第一页
        showPage(0);

        // 保存按钮区域 - 固定在窗口底部，不随内容滚动
        var btnGroup = contWin.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignment = "center";
        btnGroup.spacing = 10;
        btnGroup.margins = [0, 4, 0, 2];

        var btnSave = btnGroup.add("button", undefined, "✓ 关闭（设置已保存）");
        btnSave.preferredSize = [140, 24];
        btnSave.graphics.font = ScriptUI.newFont(btnSave.graphics.font.name, ScriptUI.FontStyle.BOLD, 10);
        
        var btnCancel = btnGroup.add("button", undefined, "取消");
        btnCancel.preferredSize = [80, 24];
        btnCancel.graphics.font = ScriptUI.newFont(btnCancel.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);

        btnSave.onClick = function() {
            ConfigModule.savePrefs(prefs);
            contWin.close(1);
        };

        btnCancel.onClick = function() {
            // 取消按钮：由于数据已实时保存，直接关闭
            contWin.close(0);
        };

        // 窗口关闭事件：用户按ESC或点击X时
        contWin.onClose = function() {
            // 数据已经在勾选时实时保存，无需额外处理
            // 这里可以添加关闭前的清理工作
            return true;
        };

        // 显示窗口
        contWin.center();
        contWin.show();
        
        // 窗口关闭后显示确认提示（仅当用户按ESC或X关闭时）
        if (contWin.closed) {
            // 静默关闭，不显示额外提示（因为已经有明确的文字提示）
        }
    } catch (e) {
        alert("设置连续镜头时出错:\n" + e.toString());
    }
};

    // 批量重命名按钮
    var btnRename = btnRow.add("button", undefined, "📝 批量重命名");
    btnRename.onClick = function() {
        var doc = app.activeDocument;
        if (!doc) { alert("请先打开文档。"); return; }
        var layers = doc.artLayers;
        if (layers.length == 0) { alert("当前文档没有图层。"); return; }

        var renameWin = new Window("dialog", "批量重命名图层");
        renameWin.orientation = "column";
        renameWin.alignChildren = "fill";
        renameWin.spacing = 6;
        renameWin.margins = 10;

        var grpPrefix = renameWin.add("group");
        grpPrefix.add("statictext", undefined, "名称前缀:");
        var txtPrefix = grpPrefix.add("edittext", undefined, "镜头_");
        txtPrefix.characters = 15;

        var grpOrder = renameWin.add("group");
        grpOrder.add("statictext", undefined, "顺序:");
        var rbTopDown = grpOrder.add("radiobutton", undefined, "从上到下 (图层面板顺序)");
        var rbBottomUp = grpOrder.add("radiobutton", undefined, "从下到上");
        rbTopDown.value = true;

        var grpNumber = renameWin.add("group");
        grpNumber.add("statictext", undefined, "起始数字:");
        var txtStartNum = grpNumber.add("edittext", undefined, "1");
        txtStartNum.characters = 5;
        grpNumber.add("statictext", undefined, "  位数:");
        var txtDigits = grpNumber.add("edittext", undefined, "3");
        txtDigits.characters = 3;

        var previewText = renameWin.add("statictext", undefined, "", { multiline: true });
        previewText.characters = 40;

        var btnPreview = renameWin.add("button", undefined, "👁 预览前5个图层");
        btnPreview.onClick = function() {
            var prefix = txtPrefix.text;
            var start = parseInt(txtStartNum.text);
            var digits = parseInt(txtDigits.text);
            if (isNaN(start) || isNaN(digits) || digits < 1) {
                alert("请输入有效的数字。");
                return;
            }
            var orderTopDown = rbTopDown.value;
            var layerList = [];
            for (var i = 0; i < layers.length; i++) layerList.push(layers[i]);
            if (!orderTopDown) layerList.reverse();

            var preview = "预览:\n";
            var count = Math.min(5, layerList.length);
            for (var i = 0; i < count; i++) {
                var newName = prefix + UtilsModule.zeroPad(start + i, digits);
                preview += layerList[i].name + " → " + newName + "\n";
            }
            if (layerList.length > 5) preview += "... 等 " + layerList.length + " 个图层";
            previewText.text = preview;
            renameWin.update();
        };

        var btnGroup = renameWin.add("group");
        btnGroup.alignment = "center";
        var btnOK = btnGroup.add("button", undefined, "开始重命名");
        var btnCancel = btnGroup.add("button", undefined, "取消");

        btnOK.onClick = function() {
            var prefix = txtPrefix.text;
            var start = parseInt(txtStartNum.text);
            var digits = parseInt(txtDigits.text);
            if (isNaN(start) || isNaN(digits) || digits < 1) {
                alert("请输入有效的数字。");
                return;
            }
            var orderTopDown = rbTopDown.value;
            var layerList = [];
            for (var i = 0; i < layers.length; i++) layerList.push(layers[i]);
            if (!orderTopDown) layerList.reverse();

            for (var i = 0; i < layerList.length; i++) {
                layerList[i].name = prefix + UtilsModule.zeroPad(start + i, digits);
            }
            renameWin.close();
            alert("重命名完成！\n共处理 " + layerList.length + " 个图层。");
        };
        btnCancel.onClick = function() { renameWin.close(); };
        renameWin.show();
    };

    // 文件名预览按钮
    var btnPreviewExport = btnRow.add("button", undefined, "📋 预览文件名");
    btnPreviewExport.onClick = function() {
        var doc = app.activeDocument;
        if (!doc) { alert("请先打开文档。"); return; }
        var hGuides = UtilsModule.getGuides(Direction.HORIZONTAL);
        if (hGuides.length < 2) { alert("请至少拉两条水平参考线。"); return; }
        var regionCount = hGuides.length - 1;
        
        // 使用与导出完全相同的图层获取方式
        var layersToProcess = UtilsModule.getAllVisibleLayers(doc);
        if (layersToProcess.length == 0) { alert("没有可处理的图层。"); return; }

        // 使用公共函数生成文件名列表
        var fileNames = UtilsModule.generateFileNames(doc, layersToProcess, regionCount, prefs.layerContinuity, txtStart.text);
        
        // 根据当前选择的格式显示扩展名
        var ext = ddFormat.selection.text === "PNG" ? ".png" : 
                  ddFormat.selection.text === "WebP" ? ".webp" : ".jpg";
        
        var previewList = "";
        for (var i = 0; i < fileNames.length; i++) {
            previewList += fileNames[i] + ext + "\n";
        }

        alert("即将生成的文件名预览：\n\n" + previewList);
    };

    // 高级选项：跳过已存在文件
    var grpAdv = dlg.add("group");
    grpAdv.alignment = "left";
    var cbSkipExisting = grpAdv.add("checkbox", undefined, "跳过已存在的文件（不覆盖）");
    cbSkipExisting.value = prefs.skipExisting || false;

    // 【新增】导出格式选择
    var grpFormat = dlg.add("group");
    grpFormat.alignment = "left";
    var lblFormat = grpFormat.add("statictext", undefined, "导出格式:");
    lblFormat.graphics.font = ScriptUI.newFont(lblFormat.graphics.font.name, ScriptUI.FontStyle.BOLD, 10);
    var ddFormat = grpFormat.add("dropdownlist", undefined, ["JPG", "PNG", "WebP"]);
    ddFormat.selection = prefs.exportFormat === ConfigModule.EXPORT_FORMATS.PNG ? 1 : 
                         prefs.exportFormat === ConfigModule.EXPORT_FORMATS.WEBP ? 2 : 0;
    ddFormat.preferredSize = [80, 20];

    // 确定按钮
    var grpBtn = dlg.add("group");
    grpBtn.alignment = "center";
    var btnOK = grpBtn.add("button", undefined, "开始导出");
    var btnCancel = grpBtn.add("button", undefined, "取消");

    btnOK.onClick = function() {
        prefs.outputFolder = txtFolder.text;
        prefs.startNumber = txtStart.text;
        prefs.mode = rbVert.value ? "vertical" : "horizontal";
        prefs.processAllLayers = ddLayers.selection.index == 1;
        prefs.skipExisting = cbSkipExisting.value;
        prefs.exportFormat = ddFormat.selection.text;

        var wVal = parseInt(txtW.text);
        var hVal = parseInt(txtH.text);
        if (!isNaN(wVal) && !isNaN(hVal) && wVal > 0 && hVal > 0) {
            var idx = ddPreset.selection.index;
            prefs.presets[idx].w = wVal;
            prefs.presets[idx].h = hVal;
        }
        prefs.currentPresetIndex = ddPreset.selection.index;
        ConfigModule.savePrefs(prefs);
        dlg.close(1);
    };
    btnCancel.onClick = function() { dlg.close(0); };

    return dlg;
}

// ---------- 导出单个画框（优化版：支持多格式、跳过和进度）----------
function exportSingleRegion(originalDoc, targetLayer, left, top, right, bottom, fileName, outputFolder, targetW, targetH, skipExisting, format, progressCallback) {
    var tempDoc = null;
    try {
        // 根据格式确定文件扩展名
        var ext = ".jpg";
        if (format === ConfigModule.EXPORT_FORMATS.PNG) ext = ".png";
        else if (format === ConfigModule.EXPORT_FORMATS.WEBP) ext = ".webp";
        
        var file = new File(outputFolder + "/" + fileName + ext);
        
        // 检查文件是否已存在，如果设置跳过则直接返回
        if (skipExisting && file.exists) {
            if (progressCallback) progressCallback("跳过: " + fileName);
            return {success: true, skipped: true};
        }

        // 优化：使用文档快照而非完整复制，减少内存和时间开销
        tempDoc = originalDoc.duplicate();
        
        // 优化：批量设置图层可见性，减少API调用次数
        var layers = tempDoc.artLayers;
        var layerFound = false;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var shouldShow = (layer.name === targetLayer.name);
            if (shouldShow) {
                layerFound = true;
            }
            layer.visible = shouldShow;
        }
        if (!layerFound) throw new Error("在临时文档中未找到图层: " + targetLayer.name);

        // 执行裁剪和缩放
        tempDoc.crop([new UnitValue(left,"px"), new UnitValue(top,"px"), new UnitValue(right,"px"), new UnitValue(bottom,"px")]);
        tempDoc.resizeImage(UnitValue(targetW,"px"), UnitValue(targetH,"px"), null, ResampleMethod.BICUBIC);

        // 【优化】根据格式保存文件
        if (format === ConfigModule.EXPORT_FORMATS.PNG) {
            var pngOpt = new PNGSaveOptions();
            pngOpt.compression = 6;
            tempDoc.saveAs(file, pngOpt, true);
        } else if (format === ConfigModule.EXPORT_FORMATS.WEBP) {
            // WebP需要检查Photoshop版本支持
            try {
                var webpOpt = new WebPSaveOptions();
                webpOpt.quality = ConfigModule.JPG_QUALITY;
                tempDoc.saveAs(file, webpOpt, true);
            } catch (e) {
                // 如果不支持WebP，降级为PNG
                var pngOpt = new PNGSaveOptions();
                pngOpt.compression = 6;
                file = new File(file.toString().replace(/\.webp$/i, ".png"));
                tempDoc.saveAs(file, pngOpt, true);
            }
        } else {
            // 默认JPG
            var jpgOpt = new JPEGSaveOptions();
            jpgOpt.quality = ConfigModule.JPG_QUALITY;
            tempDoc.saveAs(file, jpgOpt, true);
        }
        
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        
        if (progressCallback) progressCallback("导出: " + fileName + ext);
        
        return {success: true, skipped: false};
    } catch (e) {
        if (tempDoc) try { tempDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
        // 返回错误信息而不是抛出异常，避免中断整个流程
        return {success: false, error: e.toString()};
    }
}

// ---------- 主流程 ----------
try {
    var doc = app.activeDocument;
    if (!doc) throw new Error("请先打开分镜文档。");

    var prefs = ConfigModule.loadPrefs();
    var dlg = buildDialog(prefs);
    if (dlg.show() != 1) throw new Error("用户取消");

    // 【性能优化】暂停屏幕更新，大幅提升批量操作速度
    var originalDisplayDialogs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    
    var startTime = new Date().getTime();

    var targetW = ConfigModule.TARGET_W;
    var targetH = ConfigModule.TARGET_H;
    if (prefs.currentPresetIndex !== undefined && prefs.presets[prefs.currentPresetIndex]) {
        targetW = prefs.presets[prefs.currentPresetIndex].w;
        targetH = prefs.presets[prefs.currentPresetIndex].h;
    }
    var targetRatio = targetW / targetH;

    if (!prefs.outputFolder) throw new Error("请指定输出文件夹。");
    var outFolder = new Folder(prefs.outputFolder);
    if (!outFolder.exists) outFolder.create();

    var hGuides = UtilsModule.getGuides(Direction.HORIZONTAL);
    var vGuides = UtilsModule.getGuides(Direction.VERTICAL);
    if (hGuides.length < 2) throw new Error("请至少拉两条水平参考线来定义区域。");

    var layersToProcess = [];
    if (prefs.processAllLayers) {
        // 【优化】支持图层组
        layersToProcess = UtilsModule.getAllVisibleLayers(doc);
    } else {
        // 【优化】支持图层组
        layersToProcess = UtilsModule.getAllVisibleLayers(doc);
    }
    if (layersToProcess.length === 0) throw new Error("未找到可处理的图层。请确保有可见图层。");

    // 计算总导出数量用于进度条
    var totalExports = 0;
    var regionCount = hGuides.length - 1;
    for (var l = 0; l < layersToProcess.length; l++) {
        totalExports += regionCount; // 每个图层每个区域一个导出
    }

    // 【新增】创建进度窗口
    var progressWin = new Window("palette", "导出进度");
    progressWin.orientation = "column";
    progressWin.alignChildren = "fill";
    progressWin.spacing = 8;
    progressWin.margins = 12;
    progressWin.preferredSize = [400, 120];

    var progressText = progressWin.add("statictext", undefined, "准备导出...");
    progressText.justify = "center";

    var progressBar = progressWin.add("progressbar", undefined, 0, totalExports);
    progressBar.preferredSize = [380, 20];

    var progressDetail = progressWin.add("statictext", undefined, "0 / " + totalExports);
    progressDetail.justify = "center";
    progressDetail.graphics.font = ScriptUI.newFont(progressDetail.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);

    var btnCancelExport = progressWin.add("button", undefined, "取消导出");
    btnCancelExport.preferredSize = [100, 24];
    var exportCancelled = false;

    btnCancelExport.onClick = function() {
        exportCancelled = true;
        progressWin.close();
    };

    // 显示进度窗口
    progressWin.show();
    progressWin.update();

    var regionCount = hGuides.length - 1;
    
    // 图层索引映射（用于读取连续性设置，虽然重构后主要用于日志，但保留以防万一）
    var layerIndexMap = [];
    for (var l = 0; l < layersToProcess.length; l++) {
        for (var i = 0; i < doc.artLayers.length; i++) {
            if (doc.artLayers[i].name === layersToProcess[l].name) {
                layerIndexMap.push(i);
                break;
            }
        }
    }

    var logArray = [];
    var errorArray = [];
    var skipCount = 0;
    var skipExisting = prefs.skipExisting || false;

    // 【重构】使用公共函数预生成所有文件名
    var allFileNames = UtilsModule.generateFileNames(doc, layersToProcess, regionCount, prefs.layerContinuity, prefs.startNumber);
    
    // 根据格式添加扩展名
    var ext = prefs.exportFormat === ConfigModule.EXPORT_FORMATS.PNG ? ".png" : 
              prefs.exportFormat === ConfigModule.EXPORT_FORMATS.WEBP ? ".webp" : ".jpg";

    // 【新增】进度回调函数，更新进度窗口
    var currentProgress = 0;
    var progressCallback = function(msg) {
        currentProgress++;
        if (progressWin && progressWin.visible) {
            progressText.text = msg;
            progressBar.value = currentProgress;
            progressDetail.text = currentProgress + " / " + totalExports;
            progressWin.update();
        }
    };

    // 简化导出循环
    for (var l = 0; l < layersToProcess.length; l++) {
        var srcLayer = layersToProcess[l];
        // var origIndex = layerIndexMap[l]; // 如果需要日志或其他用途可以保留

        for (var i = 0; i < regionCount; i++) {
            if (exportCancelled) break;
            
            var y1 = hGuides[i], y2 = hGuides[i+1];
            if (Math.abs(y2 - y1) < 0.5) continue;
            
            var regionNum = i + 1;
            
            // 计算文件名索引
            var fileNameIndex = (l * regionCount) + i;
            var fullFileName = allFileNames[fileNameIndex] || "unknown";

            // ==================== 计算裁剪坐标 ====================
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
                var cx = doc.width.value / 2;
                left = cx - w/2;
                right = cx + w/2;
                if (left < 0)       { right -= left; left = 0; }
                if (right > doc.width.value) { left -= (right - doc.width.value); right = doc.width.value; }
            }

            // 应用垂直参考线约束
            if (vGuides.length >= 2) {
                var vLeft = vGuides[0];
                var vRight = vGuides[vGuides.length-1];
                if (left < vLeft)     { right += (vLeft - left); left = vLeft; }
                if (right > vRight)    { left -= (right - vRight); right = vRight; }
            }

            // ==================== 导出文件 ====================
            var result = exportSingleRegion(doc, srcLayer, left, top, right, bottom,
                                               fullFileName, prefs.outputFolder, targetW, targetH, 
                                               skipExisting, prefs.exportFormat, progressCallback);
            
            if (result.success) {
                if (result.skipped) {
                    skipCount++;
                } else {
                    logArray.push("[" + srcLayer.name + "] 区域" + regionNum + "-" + fullFileName + ext);
                }
            } else {
                errorArray.push(fullFileName + ": " + result.error);
            }
        }
    }
    
    // 【性能优化】恢复对话框显示设置
    app.displayDialogs = originalDisplayDialogs;
    
    // 关闭进度窗口
    if (progressWin) {
        progressWin.close();
    }
    
    var endTime = new Date().getTime();
    var duration = ((endTime - startTime) / 1000).toFixed(1);

    var msg = "导出完成！\n共处理图层: " + layersToProcess.length +
              "\n成功导出: " + logArray.length +
              "\n跳过文件: " + skipCount +
              "\n耗时: " + duration + " 秒";
    
    if (errorArray.length > 0) {
        msg += "\n\n发生错误 (" + errorArray.length + "):\n";
        // 只显示前10个错误，避免弹窗过大
        for (var k = 0; k < Math.min(errorArray.length, 10); k++) {
            msg += "- " + errorArray[k] + "\n";
        }
        if (errorArray.length > 10) msg += "... 等 " + errorArray.length + " 个错误";
    }
    
    msg += "\n\n保存在：" + prefs.outputFolder;
    
    alert(msg);

} catch (e) {
    // 【性能优化】异常时也要恢复设置
    try { app.displayDialogs = originalDisplayDialogs; } catch (e2) {}
    // 关闭进度窗口
    try { if (progressWin) progressWin.close(); } catch (e3) {}
    alert("脚本中断: " + e.toString());
}
