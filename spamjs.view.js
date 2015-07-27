define("spamjs.view").as(function(view){
	
	var fileUtil = module("jsutils.file");
	var pitana = module("pitana");
	var jQuery = module("jQuery");
	
	var TAG_NAME = "view";
	
	var TEMPLATES = {};
	var PENDINGS = {};
	var _id_ = 0;
	var VIEWS = {};
	
	var registerModule = function($container,vm){
		if(!is.Function(vm.addTo) || !is.Function(vm.view)){
			console.error(vm,"is not view module")
			throw new Error("View Add Exception");
		}
		if(this.__child__[vm.id]){
			this.remove(vm.id);
		}
		vm.__parent_id__ = this.__view_id__;
		this.__child__[vm.id] = vm;
		$container = ($container.length>0) ? $container : this.$$; 
		return $container;
	};
	
	var bindDomEvents = function(self,events){
	      //We use {"eventName hash":"handler"} kind of notation !
	    pitana.util.for(events, function(methodName, key) {
	      key = key.trim().replace(/ +/g, " ");
	      var arr = key.split(" ");
	      var eventName = arr.shift();
	      var hash = arr.join(" ");
	      var callback = pitana.domEvents.addLiveEventListener(self.$$[0], eventName, hash, self[methodName], self);
	      self.__eventsMap__[key] = {
	        eventName: eventName,
	        callback: callback
	      };
	    });
	};
	var unBindDomEvents = function(self){
		for(var key in self.__eventsMap__){
	      var v = self.__eventsMap__[key];
	      if (v !== undefined && typeof v === "object") {
	        self.$.removeEventListener(v.eventName, v.callback);
	        delete self.__eventsMap__[key];
	      }
		}
	};
	
	var _get_wrapper_ = function(_vid_,spam_class){
		return jQuery('<'+TAG_NAME+' view-id='+_vid_+' class="'+spam_class+'" rendered />');
	};
	
	return {
		model : function(model){
			if(model !== undefined){
				this.__model__ = model;
				this._apply_();
			}
			return this.__model__;
		},
		_apply_ : function(){
			if(this.__model__ && this.$$ && this.$$.html().trim()!==""){
				if(this.$$view) this.$$view.unbind();
				var self = this;
				this.$$view = rivets.bind(this.$$[0], { model : this.__model__ }, {
					handler: function(target, event, binding) {
						if(binding.keypath && self[binding.keypath]){
							self[binding.keypath](event, target,binding);
						}
					}
				});
			}
		},
		view : function(){
			return this.load.apply(this,arguments);
		},
		load : function(_obj,data){
			var self = this;
			var dff = [],obj = {};
			if(typeof _obj === "string"){
				obj = {  src : _obj, data : data };
			} else {
				obj = _obj;
			}
			 
			var render;
			if(typeof obj.src === 'string'){
				obj.tempPath = self.path(obj.src);
				dff.push(fileUtil.getHTML(obj.tempPath).done(function(respHTML,respRender){
					render = respRender;
				}));
			} else if(typeof obj.src === 'object' && typeof obj.src.done == "function"){
				dff.push(obj.src.done(function(resp){
					obj.html = resp;
				}));
			}
			if(typeof obj.data === 'string'){
				dff.push(fileUtil.getJSON(self.path(obj.data)).done(function(resp){
					obj.data = resp;
				}));
			} else if(typeof obj.data === 'object' && typeof obj.data.done == "function"){
				dff.push(obj.data.done(function(resp){
					obj.data = resp;
				}));
			}
			return jQuery.when.apply(jQuery,dff).done(function(){
				if(obj.tempPath && render){
					obj.html = render(obj.data);
				}
				if(typeof obj.selector === "string"){
					self.$$.find(obj.selector)[obj.method || "html"](obj.html);
				} else {
					self.tempPath = obj.tempPath;
					if(typeof self.src === 'string'){
						self.render(obj.data);
					} else {
						self.$$.html(obj.html);
					}
				}
			}).then(function(){
				return jQuery.when(obj.data,obj.html);
			});
		},
		_init_ : function(){
		},
		instance : function(){
			var inst = view.parent().instance.apply(this,arguments);
			inst._initOptions_.apply(inst,arguments);
			return inst;
		},
		_initOptions_ : function(_options_){
			this.__arguments__ = arguments;
			var _options_ = _options_ || {};
			this.id = _options_.id || (TAG_NAME+"_"+(++_id_));
			this.__view_id__ = window.getUUID();
			this.options = _options_;
			this.__child__ = {};
			this.__eventsMap__ = {};
			this.__model__ = _options_.model || null;
		},
		addTo : function($container){
			var spam_class = this.name.replace('\.',"-","g");
			this.$$ = _get_wrapper_.call(this,this.__view_id__,spam_class);
			bindDomEvents(this,this.events);
			var $parent = $($container || "body");
			this.selector = this.selector || "#"+this.id;
			$container = $(this.selector,$parent).first();
			if($container.length==1){
				$container.append(this.$$);
			} else {
				$parent.append(this.$$);
			}
			this.$$.addClass(spam_class);
			VIEWS[this.__view_id__] = this;
			if(!this.__parent_id__){
				var $parentViewDom = $container.closest(TAG_NAME);
				if($parentViewDom.length){
					var parentId = $parentViewDom.attr("view-id");
					var parentView = VIEWS[parentId];
					registerModule.call(parentView,$container,this);
				}
			}
			this._init_.apply(this,this.__arguments__);
			return this;
		},
		add : function(){
			var start = 0, count = arguments.length, selector;
			if(typeof arguments[0] === "string"){
				start = 1;
				selector = arguments[0];
			} 
			for(var i=start; i<count; i++){
				var vm = arguments[i];
				vm.selector = vm.selector || selector || "#"+vm.id; 
				var parent = this.$$.find( vm.selector).first();
				$container = registerModule.call(this,parent,vm);
				vm.addTo($container);
			}
			return arguments[start];
		},
		remove : function(id){
			if(id!==undefined){
				var cvm = this.__child__[id];
				if(cvm && cvm.remove) cvm.remove();
			} else {
				if(this._remove_) {
					this._remove_();
				}
				if(this.$$view) {
					this.$$view.unbind();
				}
				for(var i in this.__child__){
					this.__child__[i].remove();
					delete this.__child__[i];
				};
				unBindDomEvents(this);
				if(this.$$){
					this.$$.remove();
				}
				delete VIEWS[this.__view_id__];
			}
		},
		_remove_ : function(){
		},
		_ready_ : function(){
			console.log("----view is ready");
		}
	};
});	

(function(foo){
	foo._setFoo_("view",function(moduleName,fromModule,def){
		var deFromModule = foo.is.String(fromModule) ? fromModule : "spamjs.view";
		var defDef = def || fromModule;
		if(foo.is.Function(defDef) || foo.is.Object(defDef)){
			return foo._define_(moduleName).extend(deFromModule).as(defDef);
		} return foo._define_(moduleName).extend(deFromModule);
	});
})(this);
