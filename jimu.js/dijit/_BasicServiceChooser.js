///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2018 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/_BasicServiceChooser.html',
  'dojo/Evented',
  'dojo/_base/html',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/Deferred',
  'dijit/TooltipDialog',
  'dijit/popup',
  'esri/request',
  'dijit/form/ValidationTextBox',
  'jimu/dijit/LoadingIndicator'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, Evented,
  html, lang, on, Deferred, TooltipDialog, dojoPopup, esriRequest) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    templateString: template,
    url:'',

    //public methods:
    //setUrl
    //getUrl

    //methods to be override:
    //_createServiceChooserContent

    //events:
    //ok
    //cancel

    postMixInProperties:function(){
      this.nls = lang.mixin({}, window.jimuNls.common);
      this.nls = lang.mixin(this.nls, window.jimuNls.basicServiceChooser);
    },

    postCreate: function(){
      this.inherited(arguments);
      html.addClass(this.domNode, 'jimu-basic-service-chooser');
      this._initSelf();
    },

    setUrl: function(url){
      this.url = url;
      var def = new Deferred();
      if(this.url && typeof this.url === 'string'){
        this.urlTextBox.set('value', this.url);
        def = esriRequest({
          url: this.url,
          handleAs: 'json',
          content:{f:'json'},
          callbackParamName: 'callback'
        });
      }
      else{
        setTimeout(lang.hitch(this, function(){
          def.reject("Invalid url.");
        }), 0);
      }
      return def;
    },

    getUrl: function(){
      return this.urlTextBox.get('value');
    },

    _initSelf: function(){
      var args = {
        multiple: false,
        url: this.url
      };
      this.scc = this._createServiceChooserContent(args);
      this.own(on(this.scc, 'ok', lang.hitch(this, this._onOk)));
      this.own(on(this.scc, 'cancel', lang.hitch(this, this._onCancel)));
      var ttdContent = html.create("div");
      this.tooltipDialog = new TooltipDialog({
        content: ttdContent
      });
      this.scc.placeAt(ttdContent);

      if (this.url && typeof this.url === 'string') {
        this.urlTextBox.set('value', this.url);
      }
    },

    //to be override, return a service chooser content
    _createServiceChooserContent: function(args){/* jshint unused: false */},

    _onBtnSetSourceClick: function(event){
      event.stopPropagation();
      event.preventDefault();
      dojoPopup.close(this.tooltipDialog);
      dojoPopup.open({
        popup: this.tooltipDialog,
        around: this.urlTextBox.domNode
      });
    },

    _onOk: function(items){
      var item = items[0];
      this.urlTextBox.set('value', item.url);
      dojoPopup.close(this.tooltipDialog);
      if(item.definition){
        this.emit('ok', item);
      }
      else{
        esriRequest({
          url: item.url,
          handleAs: 'json',
          callbackParamName: 'callback',
          content: {
            f: 'json'
          }
        }).then(lang.hitch(this, function(definition){
          item.definition = definition;
          this.emit('ok', item);
        }));
      }
    },

    _onCancel: function(){
      dojoPopup.close(this.tooltipDialog);
      this.emit('cancel');
    },

    destroy: function(){
      if(this.scc){
        this.scc.destroy();
      }
      this.scc = null;
      if(this.tooltipDialog){
        this.tooltipDialog.destroy();
      }
      this.tooltipDialog = null;
      this.inherited(arguments);
    }

  });
});