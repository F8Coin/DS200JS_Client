var baseUrl= 'http://47.106.76.62:8889/';  // DS200项目接口前缀


 // 菜单栏选项
jQuery('.menusBox').on('click','.menus',function(){
     jQuery('.menus').removeClass('.active');
     jQuery(this).addClass('.active');
 })

// 设置右上角用户名称显示
jQuery('.userName').text('ntsitech');
// var userName = JSON.parse(localStorage.getItem('userInfo')).data.name;


// (1) 读取Excel文件数据
var wb;//读取完成的数据
var rABS = false; //是否将文件读取为二进制字符串

function importf(obj) {//导入
    if(!obj.files) {
        return;
    }
    var f = obj.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        if(rABS) {
            wb = XLSX.read(btoa(fixdata(data)), {//手动转化
                type: 'base64'
            });
        } else {
            wb = XLSX.read(data, {
                type: 'binary'
            });
        }
        //wb.SheetNames[0]是获取Sheets中第一个Sheet的名字
        //wb.Sheets[Sheet名]获取第一个Sheet的数据
        // JSON.stringify( XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) );
        // console.log("读取文件数据结果:"+JSON.stringify( XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) ))
        // [{"SN":"89314404000147712070"},{"SN":"01166846SKYEC33"},{"SN":"01166920SKY15A5"}]
        
        var readeInfoData= JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])))
        var deviceSnStr= ''
        for (let i = 0; i < readeInfoData.length; i++) {
            var deviceSn= readeInfoData[i].SN+','
            deviceSnStr+= deviceSn
        }

        // 发送查询请求 (多台SN设备流量查询)
        // console.log(deviceSnStr);
    };
    if(rABS) {
        reader.readAsArrayBuffer(f);
    } else {
        reader.readAsBinaryString(f);
    }
}


function fixdata(data) { //文件流转BinaryString
    var o = "",
        l = 0,
        w = 10240;
    for(; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
    return o;
}


// (2) 导出数据为Excel

// 将一个sheet转成最终的excel文件的blob对象，然后利用URL.createObjectURL下载
function sheet2blob(sheet, sheetName) {
	sheetName = sheetName || 'sheet1';
	var workbook = {
		SheetNames: [sheetName],
		Sheets: {}
	};
	workbook.Sheets[sheetName] = sheet;
	// 生成excel的配置项
	var wopts = {
		bookType: 'xlsx', // 要生成的文件类型
		bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
		type: 'binary'
	};
	var wbout = XLSX.write(workbook, wopts);
	var blob = new Blob([s2ab(wbout)], {type:"application/octet-stream"});
	// 字符串转ArrayBuffer
	function s2ab(s) {
		var buf = new ArrayBuffer(s.length);
		var view = new Uint8Array(buf);
		for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
		return buf;
	}
	return blob;
}


function openDownloadDialog(url, saveName)
{
	if(typeof url == 'object' && url instanceof Blob)
	{
		url = URL.createObjectURL(url); // 创建blob地址
	}
	var aLink = document.createElement('a');
	aLink.href = url;
	aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
	var event;
	if(window.MouseEvent) event = new MouseEvent('click');
	else
	{
		event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	}
	aLink.dispatchEvent(event);
}


// (3) GMT 与 字符串日期时间互转

//  GMT  +8小时 时间转字符串
function GMTtoStr(date) {
    // 根据GMT标识判断返回的时间类型
    if(String(date).indexOf('GMT') >= 0){
        var dateStr= date.replace('GMT','');
        var dateSceconds= new Date(dateStr).getTime() + 1000*60*60*8
        var dateGMT= new Date(dateSceconds);
        var newDateStr = DateToStr(dateGMT);
        return newDateStr;
    }else {
        // console.log('返回的是非GMT时间格式,直接使用')
    }
}

//  字符串 -8小时 转GMT
function StrtoGMT(date) {
        var dateSceconds= new Date(date).getTime() - 1000*60*60*8
        // console.log(dateSceconds);
        var dateGMT= new Date(dateSceconds);
        var newDateGMT = DateToStr(dateGMT);
        return newDateGMT + " GMT";
}

//  根据传入的时间拼接成年月日
function DateToStr(dateStr){
    var date = new Date(dateStr)
    var years, months,days,hours,minutes,seconds;
    years= date.getFullYear();

    if(date.getMonth() < 10) {
        months= "0"+(date.getMonth()+1)
    }else {
        months= date.getMonth()+1
    } 

    if(date.getDate() < 10) {
        days= "0"+date.getDate()
    }else {
        days= date.getDate()
    } 

    if(date.getHours() < 10) {
        hours= "0"+date.getHours()
    }else {
        hours= date.getHours()
    }

    if(date.getMinutes() < 10) {
        minutes= "0"+date.getMinutes()
    }else {
        minutes= date.getMinutes()
    }

    if(date.getSeconds() < 10) {
        seconds= "0"+date.getSeconds()
    }else {
        seconds= date.getSeconds()
    }

    var strTime = years+"-"+months+"-"+days+" "+hours+":"+minutes+":"+seconds;
    
    return strTime 
}

// (4) 获取url中传递的参数方法封装
function getUrlParam(name){
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r!=null) return unescape(r[2]); return null; 
}







