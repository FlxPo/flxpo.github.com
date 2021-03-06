var app = app || {};

app.UIView = Backbone.View.extend({

	el: "#ui",

  events:{
    "click #share":"popShare",
    "click #expand":"expandFlows",
    "click #contract":"contractFlows",
    "click #about_b": "about"
  },

  initialize:function(parent, options) {

    this.parent = parent;

    this.buttons = {};

    this.b_collection = new Backbone.Collection();

    this.listenTo(this.b_collection, 'add', this.addButton);
    this.b_collection.add(options.init);

    this.listenTo(Backbone, "ui:route", this.updateButtons);
    this.listenTo(Backbone, "ui:clickRadio", this.clickRadio);
    this.listenTo(Backbone, "ui:scale", this.updateScale);
    this.listenTo(Backbone, "ui:demo", this.demo);
    this.listenTo(Backbone, "ui:closeDemo", this.unloadDemo);

    this.renderScale();

    $("#share").on("click", _.bind(this.popShare, this));
    $("#expand").on("click", _.bind(this.expandFlows, this));
    $("#contract").on("click", _.bind(this.contractFlows, this));
    $("#about_b").on("click", _.bind(this.about, this));

    _.bindAll(this, "about", "unloadAbout", "demo", "unloadDemo");

  },

  renderScale:function() {
    var paper = Raphael($("#fs_container div")[0], 100, 200);
    var scale_icon = paper.path();
    this.Rscale = scale_icon;
  },

  updateScale:function(args) {

      // Adapt the legend
      var vscale = Math.round(0.0001 * 80/args.scale) / 0.0001;
      var hscale = vscale*args.scale;

      if (hscale < 2) {

        $("#fs_container").hide();
        $("#fs_text").hide();

      } else if (!args.virtual) {

        $("#legend").velocity("fadeIn", {duration:200, display:"block", delay:1000});

        $("#fs_container").show();
        $("#fs_text").show();
        $("#fs_container div").css({height:hscale + 10})
        this.Rscale.attr({path:["M",30,hscale+5,"H",25,"V",5,"H",30], "stroke-width":3, "stroke":"#ccc"});
        $("#legend #fs_text p").html(utils.formatVolume(vscale, " ") + " " + args.unit);

      }

    },

    addButton:function(button) {
      if ($(button.get("el")).length > 0) {
        this.buttons[button.get("id")] = new app.ButtonView( {model:button, el:$(button.get("el"))} );
      }
    },

    showButtons:function(next, delay) {

      args = next.model ? next.model.get("ui_elements") : next;
      next = next.model ? next : this.parent.currentPage;

      var d = delay || 0;

      $("#legend").velocity("fadeOut", {duration:200});

      // Hide every button
      _.each(this.buttons, function(value) {
        var sc = value.model.get("show_class");
        value.$el.velocity("fadeOut", {duration:200})
      })

      // Reset the zoom
      next.$itemcontainer && next.$itemcontainer.panzoom("destroy");
      $("#zoom").find(".zoom-range").off();
      $("#zoom").find(".zoom-range").val(50);

      this.p_showed_buttons = this.showed_buttons;
      this.showed_buttons = args;

      var len = args.length;

      while(len--) {
        var bv = this.buttons[args[len]];
        var sc = bv.model.get("show_class");
        this.buttons[args[len]].$el.velocity("fadeIn", {display:sc, duration:200, delay:d});

        if (args[len] == "zoom") {

          var pz = next.$itemcontainer.panzoom();
          var self = this;
          self.startZoom = $("#zoom").find(".zoom-range").val();

          $("#zoom").find(".zoom-range").on("mousedown", function( e ) {
            self.startZoom = this.value*1;
          })

          $("#zoom").find(".zoom-range").on("mouseup", function( e ) {

            var delta = self.startZoom - this.value;
            self.startZoom = this.value;
            var zoomOut = (delta > 0);

            lpw = $("#leftpanel").width()
            ws = utils.getWindowSize();
            ws = {clientX: (lpw*0.5+ws.w*0.5), clientY:ws.h*0.5};

            pz.panzoom("zoom", zoomOut, {
              increment:Math.abs(delta)/100,
              animate:true,
              focal:ws
            });

            mat = pz.panzoom("getMatrix").input;
            Backbone.trigger("items:updatePositions", {mat:mat, ws:ws});
            Backbone.trigger("projects:updatePositions", {mat:mat, ws:ws});

          })
        } 
      }

      //$("#topright").velocity("fadeIn", {duration:350});
    },

    clickRadio:function(args) {
      var radio = this.buttons[args.id].model.get("radio"), len = radio.length;
      while(len--) {
        var id = radio[len];
        this.buttons[id].unclick();
      }
    },

    updateButtons:function(args) {
      var state = args.state;
      state.rootState === "p" && this.buttons[state.rootState].clk({silent:true});
      state.territoryState !== null && state.rootState !== "p" && this.buttons[state.territoryState].clk({silent:true});
      state.typeState !== null && this.buttons[state.typeState].clk({silent:true});
      state.timeState !== null && this.toggleTime(state);
    },

    popShare:function() {
      var w = window.screen.availWidth;
      var h = window.screen.availHeight;
      window.open("html/share.html",'popUpWindow',"height=100,width=400,left="+ w/2 +",top="+ h/2 +",resizable=no,scrollbars=no,toolbar=no,menubar=no,location=no,directories=no,status=no")
    },

    toggleTime:function(state) {

      var $el = this.buttons["time"].$el;
      var $toggle = $el.find(".toggle");
      var $label = $el.find(".toggle span");

      // $("#trend_legend").removeClass("show_h");

    // Target state : 2012/Tendances ?
    if (state.timeState === "2") {

      // Move toggle on the right
      $toggle.addClass("toggle-right");

      // Change span content and display legend if needed
      if (state.typeState === "matter") {
        $label.html("2014");
        // $("#trend_legend").addClass("show_h");
      } else if (state.typeState === "energy") {
        $label.html("2014");
      } else {
        $label.html("2015");
      }

    // Else move toggle on the left and hide legend
  } else {
    $toggle.removeClass("toggle-right");

      // Change span content and display legend if needed
      if (state.typeState === "matter") {
        $label.html("2003");
      } else {
        $label.html("2004");
      }
    }

  },

  toggleX:function() {
    var about_b = this.buttons["about"];
    var $span = about_b.$el.find("span");
    if (!this.about_clicked) {
      this.about_clicked = true;
      $span.html("x");
      $span.removeClass("i-info");
      $span.addClass("x-info");
    } else {
      this.about_clicked = false;
      $span.html("i");
      $span.addClass("i-info");
      $span.removeClass("x-info");
    }
  },

  about:function() {

    // Store all buttons shown, then hide all buttons of the ui
    this.showButtons(["about"]);

    // Toggle the X to exit the modal
    this.toggleX();

    // Create the view
    this.about_view = new app.AboutView();
    this.$el.first().append(this.about_view.render().el);

    // Bind the close call to the x button
    $("#about_b").off("click");
    $("#about_b").on("click", _.bind(this.unloadAbout, this));

  },

  unloadAbout:function() {

    this.showButtons(this.p_showed_buttons);

    this.toggleX();

    this.about_view.close();
    
    $("html, body").scrollTop(0);
    $("body").removeClass("scrollable");

    $("#about_b").off("click");
    $("#about_b").on("click", _.bind(this.about, this));

  },

  demo:function() {
    this.demo_view = new app.DemoView();
    this.$el.append(this.demo_view.render().el);
  },

  unloadDemo:function() {
    this.demo_view.close();
    this.demo_view.remove();
  },

  expandFlows:function() {
    // Broadcast a expand event for the flows view to catch
    Backbone.trigger("flows:expand", {type:app.instance.router.state.typeState});
  },

  contractFlows:function() {
    // Broadcast a contract event for the flows view to catch
    Backbone.trigger("flows:contract", {type:app.instance.router.state.typeState});
  }

});