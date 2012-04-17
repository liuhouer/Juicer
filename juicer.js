/*
	@author: guokai
	@email/gtalk: badkaikai@gmail.com
	@blog/website: http://benben.cc
	@license: apache license,version 2.0
	@version: 0.2.1
*/

(function() {
	var juicer={
		version:'0.2.1'
	};

	this.__cache={};
	
	this.__escapehtml={
		__escapehash:{
			'<':'&lt;',
			'>':'&gt;',
			'"':'&quot;',
			'&':'&amp;'
		},
		__escapereplace:function(k) {
			return __escapehtml.__escapehash[k];
		},
		__escape:function(str) {
			return typeof(str)!=='string'?str:str.replace(/[&<>"]/igm,__escapehtml.__escapereplace);
		}
	};
	
	juicer.settings = {
		forstart:/{@for\s*([\w\.]*?)\s*as\s*(\w*?)}/igm,
		forend:/{@\/for}/igm,
		ifstart:/{@if\s*([^}]*?)}/igm,
		ifend:/{@\/if}/igm,
		interpolate:/\${([\s\S]+?)}/igm,
		noneencode:/\$\${([\s\S]+?)}/igm
	};
	
	juicer.template=function() {
		this.__shell=function(tpl) {
			tpl=tpl
				//for expression
				.replace(juicer.settings.forstart,function($,varname,alias) {
					return '<% for(var i=0,l='+varname+'.length;i<l;i++) {var '+alias+'='+varname+'[i]; %>';
				})
				.replace(juicer.settings.forend,'<% } %>')
				//if expression
				.replace(juicer.settings.ifstart,function($,condition) {
					return '<% if('+condition+') { %>';
				})
				.replace(juicer.settings.ifend,'<% } %>')
				//interpolate without escape
				.replace(juicer.settings.noneencode,function($,varname) {
					return '<%= '+(varname!=='.'?varname:'i')+' %>';
				})
				//interpolate with escape
				.replace(juicer.settings.interpolate,function($,varname) {
					return '<%= __escapehtml.__escape('+(varname!=='.'?varname:'i')+') %>';
				});
				
			return tpl;
		};
		
		this.__pure=function(tpl,options) {
			if(options && options.loose===true) {
				buf=this.__looseconvert(tpl);
			} else {
				buf=this.__convert(tpl);
			}
			
			return buf;
		};
		
		this.__convert=function(tpl) {
			var buf=[].join('');
			buf+="var data=data||{};";
			buf+="var out='';out+='";
			buf+=tpl
					.replace(/\\/g,"\\\\")
					.replace(/[\r\t\n]/g," ")
					.replace(/'(?=[^%]*%>)/g,"\t")
					.split("'").join("\\'")
					.split("\t").join("'")
					.replace(/<%=(.+?)%>/g,"';out+=$1;out+='")
					.split("<%").join("';")
					.split("%>").join("out+='")+
					"';return out;";
			return buf;
		};
		
		this.__looseconvert=function(tpl) {
			var buf=[].join('');
			buf+="var data=data||{};";
			buf+="var p=[];";
			buf+="with(data) {"+
					"p.push('" +
						tpl
							.replace(/\\/g,"\\\\")
							.replace(/[\r\t\n]/g," ")
							.split("<%").join("\t")
							.replace(/((^|%>)[^\t]*)'/g,"$1\r")
							.replace(/\t=(.*?)%>/g,"',$1,'")
							.split("\t").join("');")
							.split("%>").join("p.push('")
							.split("\r").join("\\'")+
					"');"+
				"};"+
				"return p.join('');";
			return buf;
		};
		
		this.parse=function(tpl,options) {
			tpl=this.__shell(tpl);
			tpl=this.__pure(tpl,options);
			
			this.render=new Function('data',tpl);
			return this;
		};
	};
	
	juicer.compile=function(tpl,options) {
		var engine=__cache[tpl]?__cache[tpl]:new this.template().parse(tpl,options);
		if(!options || options.cache!==false) __cache[tpl]=engine;
		return engine;
	};
	
	juicer.to_html=function(tpl,data,options) {
		return this.compile(tpl,options).render(data);
	};
	
	typeof(module)!=='undefined' && module.exports?module.exports=juicer:this.juicer=juicer;
})();