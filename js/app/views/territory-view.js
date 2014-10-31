var app = app || {};

app.TerritoryView = Backbone.View.extend({

	id:"territory",

	template: _.template( $('#territory-template').html() ),

	initialize:function(options) {

		// Load intro if needed
		this.intro = options.intro;
		

		// Load core data of the view
		var data_url = this.model.get("data_url");
		var self = this;

		this.init_time = options.time;

		$.ajax({

			url:data_url

		}).done(function(data) {
			
			// Load Items
			var items = new app.ItemCollection(data.items);
			self.items_views = new app.ItemsView( {parent:self, collection:items} );

			// Load flows
			var flows = new app.FlowCollection(data.flows);
			self.flows_views = new app.FlowsView( {parent:self, collection:flows, items_views:self.items_views} );

			// Load projects
			if (data.projects) {
				var projects = new app.ProjectCollection(data.projects);
				self.projects_views = new app.ProjectsView( {parent:self, collection:projects, items_views:self.items_views} );
			}

			// Load stories
			var stories = new app.StoryCollection(data.stories[options.type]);
			self.stories_views = new app.StoriesView( {collection:stories} );

			// Load view
			options.goto(self);

		})

		// When rendering, Wait for items to be loaded before computing flow paths
		this.listenTo(Backbone, "items:loaded", function() {

			this.projects_views && this.$projectcontainer.append( this.projects_views.render().el );
			Backbone.trigger("stories:go", {id:0});

			if (this.intro) {
				var iv = new app.IntroView();
				$("body").append( iv.render().el );
				console.log(iv)
				iv.$back.velocity({opacity:0.6}, {duration:300, delay:250});
			}


			this.$storycontainer.velocity("fadeIn", {duration:300, delay:250});
			this.$flowcontainer.velocity("fadeIn", {duration:300, delay:250});
			this.$popcontainer.velocity("fadeIn", {duration:300, delay:250});
			$("#flowscale").velocity("fadeIn", {duration:300, delay:250});
		});

	},

	// Render functions
	render: function(options) {

		options = options || {};
		this.adjustVertically(options);

		this.$el.html( this.template() );
		this.$itemcontainer = this.$el.find("#itemcontainer");
		this.$flowcontainer = this.$el.find("#flowcontainer");
		this.$projectcontainer = this.$el.find("#projectcontainer");
		this.$storycontainer = this.$el.find("#storycontainer");
		this.$popcontainer = this.$el.find("#popcontainer");

		this.items_views.render();
		this.$storycontainer.append( this.stories_views.render().el );



		return this;
	},

	adjustVertically:function(options) {
		var dz = options.dz || 0;
		if (dz < 0) {
			this.$el.addClass("up")
		} else if (dz > 0) {
			this.$el.addClass("down")
		} else {
			this.$el.addClass("middle")
		}
		return this;
	},

	// Removes all elements of the view
	close:function() {

		this.items_views.close();
		this.flows_views.close();
		this.stories_views.close();
		
		this.items_views.remove();
		this.flows_views.remove();
		this.stories_views.remove();

		if (this.projects_views) {
			this.projects_views.close();
			this.projects_views.remove();
		}

		this.stopListening();
	},

	transitionIn:function(options) {

		var self = this;
		var callback = function() {
			// self.$storycontainer.velocity("fadeIn", {duration:300});
			// self.$flowcontainer.velocity("fadeIn", {duration:300});
		}

		this.$el.velocity( {top:"0%"}, {duration:1000, complete:callback} );
	},

	transitionOut:function(options) {

		this.$storycontainer.velocity("fadeOut", {duration:300});
		this.$flowcontainer.velocity("fadeOut", {duration:300});
		this.$popcontainer.velocity("fadeOut", {duration:300});

		var dz = options.dz || 0, t = "0%";
		if (dz === 0) {
			options.callback();
			return;
		} else if (dz > 0) {
			t = "-100%";
		} else if (dz < 0) {
			t = "100%";
		}
		this.$el.velocity( {top:t}, {duration:1000, complete:options.callback} );

	}

});