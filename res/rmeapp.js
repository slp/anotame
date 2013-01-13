jQuery(function( $ ) {
    'use strict';

    var Utils = {
	// https://gist.github.com/1308368
        uuid: function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b},
        // http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
        urlify: function(text){var urlRegex=/(https?:\/\/[^\s]+)/g;return text.replace(urlRegex,function(url){return '<a class="todo-a" href="'+ url+'">'+url+'</a>';})},
    };

    var App = {
	init: function() {
            if ( $.browser.msie && (parseInt($.browser.version, 10) < 9)) {
                alert("Lo siento, tu navegador no está soportado. Por favor, prueba con Chrome, Firefox, Safari, o Internet Explorer en versión 9 o superior");
                window.location.href = "http://google.com";
            }

	    this.ENTER_KEY = 13;
            this.nickname = "You don't exist";
            this.logout_url = "http://reddit.com";
            this.taskList = "";
            this.staticTabs = [{"tab-id": "personal", "tab-name": "Personal"}, {"tab-id": "work", "tab-name": "Trabajo"}, {"tab-id": "unsorted", "tab-name": "Miscelánea"}];
            if ($.cookie('rme_currentTab') == null) {
                $.cookie('rme_currentTab', 0);
            }

            this.currentTab = $.cookie('rme_currentTab');
            this.$menu = "";
	    this.cacheElements();
	    this.bindEvents();
            this.getTasks();
	    this.render();
	},
	cacheElements: function() {
            if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry/).test(navigator.userAgent)) {
                this.todoTemplate = Handlebars.compile( $('#todo-template-mobile').html() );
            }
            else {
	        this.todoTemplate = Handlebars.compile( $('#todo-template').html() );
            }
            this.tabTemplate = Handlebars.compile( $('#tab-template').html() );
            this.tabsHeaderTemplate = Handlebars.compile( $('#tabs-header-template').html() );
            this.logoutTemplate = Handlebars.compile( $('#logout-template').html() );
	    this.$todoApp = $('#rmeapp');
            this.$tabs = $('#tabs');
            this.$tabList = $('#tab-list');
            this.$tabsHeader = $('#tabs-header');
	    this.$newTodo = $('#new-todo');
            this.$logout = $('#logout');
            this.$clearCompleted = $('#clear-completed');
            
            this.$tabs.tabs();                      
            this.$clearCompleted.button().click(this.clearCompleted);
	},
	bindEvents: function() {
            this.$tabs.on("tabsactivate", this.tabActivate);
	    this.$newTodo.on( 'keyup', this.create );
	},
        getTasks: function() {
            $.ajax({
                url: '/task/getall',
                async: false,
                dataType: 'json',
                success: function(data) {
                    App.taskList = eval(data);
                    if (App.taskList.length == 1) {
                        if (App.taskList[0]["taskid"] == "login") {
                            window.location.href = App.taskList[0]["taskname"];
                        }
                        else {
                            App.nickname = App.taskList[0]["taskname"];
                            App.logout_url = App.taskList[0]["category"];
                        }
                    }
                    else {
                        for (var i = 0; i < App.taskList.length; i++) {
                            if (App.taskList[i]["taskid"] == "nickname") {
                                App.nickname = App.taskList[0]["taskname"];
                                App.logout_url = App.taskList[0]["category"];
                                App.taskList.splice(i, 1);
                                break;
                            }
                        }
                    }
                }});
        },
	render: function() {
            this.$tabsHeader.html(this.tabsHeaderTemplate( this.staticTabs ));
            var tabList_html = ""
            var sortable = [];

            for (var i = 0; i < this.taskList.length; i++) {
                sortable.push([this.taskList[i]["priority"], this.taskList[i]["taskname"], i]);
            }
            sortable.sort(function(a, b) { 
                if (a[0] === b[0]) {
                    return a[1].toLowerCase().localeCompare(b[1].toLowerCase());
                }
                else {
                    return a[0] - b[0];
                }
            });

            for (var i = 0; i < this.staticTabs.length; i++) {
                var entries_html = "";
                for (var j = 0; j < this.taskList.length; j++) {
                    var t = this.taskList[sortable[j][2]];
                    if (t["category"] === this.staticTabs[i]["tab-id"]) {
                        var task = { };
                        task["taskid"] = t["taskid"];
                        task["taskname"] = Utils.urlify(t["taskname"]);
                        if (t["priority"] == 50) {
                            task["completed"] = 1;
                        }
                        else {
                            task["completed"] = 0;
                        }
                        entries_html += this.todoTemplate( task );
                    }
                }
                tabList_html += this.tabTemplate([{"tab-id": this.staticTabs[i]["tab-id"], "entries": entries_html}]);
            }
            this.$tabList.html(tabList_html);
            var activeTab = this.currentTab;
            this.$tabs.tabs("refresh");
            this.$tabs.tabs("option", "active", activeTab);
            
            for (var i = 0; i < this.staticTabs.length; i++) {
                var list = $('#' + this.staticTabs[i]["tab-id"]);
		list.on( 'dblclick', 'label', this.edit );
		list.on( 'keypress', '.edit', this.blurOnEnter );
		list.on( 'blur', '.edit', this.update );
		list.on( 'click', '.destroy', this.destroy );
                list.on( 'click', '.destroy-mobile', this.destroy );
            }

            for (var j = 0; j < this.taskList.length; j++) {
                var btnName = "#btn-" + this.taskList[j]["taskid"];
                var btnWidget = $(btnName).button({text: false});
                var prio = this.taskList[j]["priority"];
                btnWidget.addClass("rmebutton");
                if (prio != 50) {
                    btnWidget.addClass("rmeprio" + this.taskList[j]["priority"]);
                }
                btnWidget.next().menu( {trigger: $(btnName)} ).on("menuselect", this.menuSelect);
            }

            this.$logout.html(this.logoutTemplate({"nickname": App.nickname, "logout_url": App.logout_url}));
	},
        menuSelect: function(e, ui) {
            var prio = (ui.item.index() + 1) * 10;
            var tid = ui.item.parent().closest('li').data('id');
            for (var i = 0; i < App.taskList.length; i++) {
                if (App.taskList[i].taskid == tid) {
                    if (App.taskList[i].priority != prio) {
                        App.taskList[i].priority = prio;
                        $.ajax({type: 'POST',
                                url: "/task/change/priority", 
                                data: {taskid: App.taskList[i].taskid, priority: prio},
                                async: true,
                                success: function(data) {
                                },
                                error: function (xhr, ajaxOptions, thrownError) {
                                    alert("Oops... ocurrió un error al conectar con el servidor, voy a refrescar la pantalla para recuperar la conexión.");
                                    window.location.href = "/";
                                }});
                    }
                    break;
                }
            }
            App.render();
        },
        clearCompleted: function(e, ui) {
            $.ajax({type: 'POST',
                    url: "/task/clearcompleted", 
                    async: true,
                    success: function(data) {
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Oops... ocurrió un error al conectar con el servidor, voy a refrescar la pantalla para recuperar la conexión.");
                        window.location.href = "/";
                    }});
            do {
                var deleted = false
                for (var i = 0; i < App.taskList.length; i++) {
                    if (App.taskList[i]["priority"] == 50) {
                        App.taskList.splice(i, 1);
                        deleted = true;
                        break;
                    }
                }
            } while (deleted == true);
            App.render();
        },
        tabActivate: function(e, ui) {
            App.currentTab = ui.newTab.index();
            $.cookie('rme_currentTab', App.currentTab);
        },
	create: function(e) {
	    var $input = $(this),
	    val = $.trim( $input.val() );
	    if ( e.which !== App.ENTER_KEY || !val ) {
		return;
	    }
            var cTabId = App.staticTabs[App.currentTab]["tab-id"];
            $.ajax({type: 'POST',
                    url: "/task/add", 
                    data: { taskname: val, priority: 40, category: cTabId },
                    async: false,
                    success: function(data) {
                        App.taskList.push({
                            taskid: data,
                            taskname: val,
                            category: cTabId,
                            priority: 40});
	                App.render();
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Oops... ocurrió un error al conectar con el servidor, voy a refrescar la pantalla para recuperar la conexión.");
                        window.location.href = "/"
                    }});
	    $input.val('');
	},
	edit: function() {
            var tid = $(this).closest('li').data('id');
            var t = { }
            for (var i = 0; i < App.taskList.length; i++) {
                if (App.taskList[i].taskid == tid) {
                    t = App.taskList[i];
                    break;
                }
            }
            
            $(this).closest('label').html(t["taskname"]);
            $(this).closest('li').find('.edit').val(t["taskname"]);
	    $(this).closest('li').addClass('editing').find('.edit').focus();
	},
	blurOnEnter: function( e ) {
	    if ( e.keyCode === App.ENTER_KEY ) {
		e.target.blur();
	    }
	},
	update: function() {
	    var val = $.trim( $(this).removeClass('editing').val() );
            var tid = $(this).parent().closest('li').data('id');
            var t = { }
            for (var i = 0; i < App.taskList.length; i++) {
                if (App.taskList[i].taskid == tid) {
                    t = App.taskList[i];
                    break;
                }
            }
            
            $.ajax({type: 'POST',
                    url: "/task/change/name", 
                    data: {taskid: t.taskid, taskname: val},
                    async: true,
                    success: function(data) {
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Oops... ocurrió un error al conectar con el servidor, voy a refrescar la pantalla para recuperar la conexión.");
                        window.location.href = "/"
                    }});
            t.taskname = val;
            App.render();

	},
	destroy: function(e, ui) {
            var tid = $(this).parent().closest('li').data('id');
            var t = { }
            for (var i = 0; i < App.taskList.length; i++) {
                if (App.taskList[i].taskid == tid) {
                    t = App.taskList[i];
                    break;
                }
            }
            
            $.ajax({type: 'POST',
                    url: "/task/remove", 
                    data: {taskid: t.taskid},
                    async: true,
                    success: function(data) {
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        alert("Oops... ocurrió un error al conectar con el servidor, voy a refrescar la pantalla para recuperar la conexión.");
                        window.location.href = "/"
                    }});
            App.taskList.splice(i, 1);
            App.render();
	}
    };

    App.init();

});
