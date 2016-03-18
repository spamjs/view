define("spamjs.view").as(function(view){
	
	var fileUtil = module("jsutils.file");
	var pitana = module("pitana");
	var jQuery = module("jQuery");
	
	var TAG_NAME = "view", ANI_REMOVING = "view-ani-removing",ANI_ADDING = "view-ani-adding";
	
	var TEMPLATES = {};
	var PENDINGS = {};
	var _id_ = 0;
	var VIEWS = {};
  var __$trash__;
	
	/**
	 * Description
	 * @method registerModule
	 * @param {$DOM} $container
	 * @param {SpamjsView} vm
	 * @return $container
	 */
	var registerModule = function($container,vm){
		if(!is.Function(vm.addTo) || !is.Function(vm.view)){
			console.error(vm,"is not view module");
			throw new Error("View Add Exception");
		}
		if(this.__child__[vm.id]){
			this.remove(vm.id);
		}
		vm.__parent_id__ = this.__view_uuid__;
		this.__child__[vm.id] = vm;
		$container = ($container.length>0) ? $container : this.$$; 
		return $container;
	};
	
	/**
	 * Description
	 * @method bindDomEvents
	 * @param {SpamjsView} self
	 * @param {} events
	 * @return 
	 */
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
	/**
	 * Description
	 * @method unBindDomEvents
	 * @param {} self
	 * @return 
	 */
	var unBindDomEvents = function(self){
		for(var key in self.__eventsMap__){
	      var v = self.__eventsMap__[key];
	      if (v !== undefined && typeof v === "object") {
	        self.$$[0].removeEventListener(v.eventName, v.callback);
	        delete self.__eventsMap__[key];
	      }
		}
	};
	
	var _get_wrapper_ = function(_vid_,spam_class,$$$view){
    if($$$view){
      $$$view.addClass(spam_class).attr("rendered","rendered").attr("view-uuid", _vid_);
      return $$$view;
    }
		return jQuery('<'+TAG_NAME+' view-uuid='+_vid_+' class="'+spam_class+'" rendered />');
	};
	
	return {
		/**
		 * Description
		 * @method model
		 * @param {} model
		 * @return MemberExpression
		 */
		model : function(model){
			if(model !== undefined){
				this.__model__ = model;
				this._apply_();
			}
			return this.__model__;
		},
		/**
	         * It will destroy currect object and rebuild whole binding thing again;
	         */
	        remodel : function(){
	            return this.model(JSON.parse(JSON.stringify(this.model())));
	        },
		_apply_ : function(){
			if(this.__model__ && this.$$ && this.$$.html().trim()!==""){
				if(this.$$view) this.$$view.unbind();
				var self = this;
				this.$$view = rivets.bind(this.$$[0], { model : this.__model__ }, {
					/**
					 * Description
					 * @method handler
					 * @param {} target
					 * @param {} event
					 * @param {} binding
					 * @return 
					 */
					handler: function(target, event, binding) {
						if(binding.keypath && self[binding.keypath]){
							self[binding.keypath](event, target,binding);
						}
					}
				});
			}
		},
		/**
		 * Description
		 * @method view
		 * @return CallExpression
		 */
		view : function(){
			return this.load.apply(this,arguments);
		},
		/**
		 * Description
		 * @method load
		 * @param {} _obj
		 * @param {} data
		 * @return CallExpression
		 */
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
		/**
		 * Description
		 * @method instance
		 * @return SpamjsView
		 */
		instance : function(){
			var inst = view.parent().instance.apply(this,arguments);
			inst._initOptions_.apply(inst,arguments);
			return inst;
		},
		_initOptions_ : function(_options_){
			this.__arguments__ = arguments;
			var _options_ = _options_ || {};
      this.id = _options_.id || (TAG_NAME+"_"+(++_id_));
      this.__view_delay__ = _options_.delay;
			this.__view_uuid__ = window.getUUID();
			this.options = (arguments[0] && arguments[0].options) ? arguments[0].options :  _options_;
			this.__child__ = {};
			this.__eventsMap__ = {};
			this.__model__ = _options_.model || null;
		},
		/**
		 * Description
		 * @method addTo
		 * @param {} $container
		 * @return ThisExpression
		 */
		addTo : function($container,$$$){
      var self = this;
      this.$$$ = $$$;
      this.__deferred__ = jQuery.Deferred();
      var spam_class = "view-"+this.name.replace(/\./g,"-") + " " + "view-id-"+(this.id+"").replace(/\./g,"-");
			this.$$ = _get_wrapper_.call(this,this.__view_uuid__,spam_class,$$$);
			bindDomEvents(this,this.events);
			var $parent = $($container || "body");
			this.selector = this.selector || "#"+this.id;
			$container = $(this.selector,$parent).first();
      this.$$.addClass(ANI_ADDING);
      if(!this.$$$){
        if($container.length==1){
          $container.append(this.$$);
        } else {
          $parent.append(this.$$);
        }
      }
			this.$$.addClass(spam_class);
			VIEWS[this.__view_uuid__] = this;
			if(!this.__parent_id__){
				var $parentViewDom = $container.closest(TAG_NAME+", spamjs-view");
				if($parentViewDom.length){
					var parentId = $parentViewDom.attr("view-uuid");
					var parentView = VIEWS[parentId];
					registerModule.call(parentView,$container,this);
				}
			}
      window.setTimeout(function(){
        self.$$.removeClass(ANI_ADDING);
      },self.__view_delay__);

			jQuery.when(this._init_.apply(this,this.__arguments__)).done(function(){
        self.__deferred__.resolveWith(self);
      });
			return this;
		},
		/**
		 * Description
		 * @method add
		 * @return MemberExpression
		 */
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
    loadView : function(config){
      var self = this;
      var dff = jQuery.Deferred();
      return module(config.name, function(targetModule){
          var targetModuleInstance = targetModule.instance(config)
          self.add(targetModuleInstance).done(function(){
            dff.resolveWith(targetModuleInstance);
          })
      });
      return dff.promise();
    },
    done : function(cb){
      return this.__deferred__.promise().done(cb);
    },
		/**
		 * Description
		 * @method remove
		 * @param {} id
		 * @return 
		 */
		remove : function(id,options){
      var dff = jQuery.Deferred();
      var _options = options || {};
			if(id!==undefined){
				var cvm = this.__child__[id];
				if(cvm && cvm.remove) cvm.remove();
			} else {
        var self = this;
				if(this._remove_) {
					this._remove_();
				}
				for(var i in this.__child__){
					this.__child__[i].remove();
					delete this.__child__[i];
				};
        if(this.$$view) {
          this.$$view.unbind();
        }
        unBindDomEvents(this);
				if(this.$$){
          try {
            this.$$.addClass(ANI_REMOVING);
            var onDetachView = function(){
              try{
                self.$$.detach();
                dff.resolve(self);
                __$trash__.append(this.$$);
              } catch(e){
                console.warn("ViewDetachException:",e)
              }
            };
            if(self.__view_delay__){
              window.setTimeout(onDetachView,self.__view_delay__);
            } else {
              onDetachView();
            }
            window.setTimeout(function(){
                self.$$.remove();
            },5000);
          } catch (e){
            console.warn("ViewDetachException:",e)
          }
				}
				delete VIEWS[this.__view_uuid__];
			}
      return dff.promise();
		},
    trigger : function(eventName,detail){
      return  pitana.domEvents.trigger(this.$$[0], eventName, detail);
    },
		_remove_ : function(){
		},
		_ready_ : function(){
      __$trash__ = jQuery("<view-trash hidden style='display:none'>");
      jQuery("body").append(__$trash__);
			console.log("----view is ready");
		}

	};
});


_tag_('spamjs.view.inline', function (date) {

  return {
    tagName: "spamjs-view",
    events: {
    },
    accessors: {
      module: {
        type: "string",
        default: ""
      },
      rendered: {
        type: "boolean",
        default: true
      }
    },
    attachedCallback: function () {
      var self = this;
      this.$.rendered = !!this.$.rendered;
      if (this.$.module && !this.$.rendered){
        _module_(this.$.module, function(MODULE){
          var $this = jQuery(self.$);
          self.modeInstance = MODULE.instance({
            id : $this.attr("id"),
            options : {
              data : $this.data()
            }
          }).addTo($this.parent(),$this);
        });
      }
    },
    detachedCallback :  function(){
      var self = this;
      self.modeInstance.remove();
      delete self.modeInstance;
    }
  };

});
