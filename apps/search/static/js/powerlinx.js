  function removeUselessSections() {
  	// Check and remove empty block of info
    $(".info-desc").each(function(){
      if (!$(this).text().trim().length) {
          $(this).parent().remove();
      }
  	});
  }
  
  window.addEventListener("message", receiveMessage, false);

  function receiveMessage(event)
  {
    if (event.origin === "https://lab.powerlinx.com:3000") {
  		loginDialogCallback(event.data);
  		return true;
  	}
    return false;
  }
  
  var profile = null;
  var postLoginCallback = null;
  var postLoginAttr = null;
  var apiVersion = 'v29.0',
  //    clientId = '3MVG98RqVesxRgQ5sobbrBxQuvC5MgxmY0W2X3ZrSwyr04E9UIktKQMXlbkVoiXnyJDDiwbI8jivpIH2YMniD', // staging
    clientId = '3MVG98XJQQAccJQf814x6uMwljhpiNwdvMJEIMn2_wl2AaNJRACr6Qat8N3b95GbijpGqgCT9kw5QkqTpzoyM',
  //    loginUrl = 'https://cs10.salesforce.com/', // staging
    loginUrl = 'https://na11.salesforce.com/',
    redirectURI = "https://lab.powerlinx.com:3000/oauthcallback.html",
    proxyURL = 'https://lab.powerlinx.com:3000/proxy/',
    client = null;

  function login(callback, callbackAttr) {
  	var access_token = $.cookie('access_token');
  	var instance_url = $.cookie('instance_url');
    
    // Already logged in SalesForce API
  	if (access_token && access_token !== '' && instance_url && instance_url !== '') {
  		client.setSessionToken(access_token, apiVersion, instance_url);
  		callback(callbackAttr);
    } else {
        var url = loginUrl + 'services/oauth2/authorize?display=popup&response_type=token' +
          '&client_id=' + encodeURIComponent(clientId) +
          '&redirect_uri=' + encodeURIComponent(redirectURI);
  
  	  	popupCenter(url, 'login', 700, 600);
  		postLoginCallback = callback;
  		postLoginAttr = callbackAttr;
    }
    return true;
  }
  
  function loginDialogCallback(response) {
      if (response && response.access_token) {
  			// Save info in cookie to avoid login popup each time
  		  $.cookie('access_token', response.access_token, {expires: 1, secure: true});
  	      $.cookie('instance_url', response.instance_url, {expires: 1, secure: true});
  
          client.setSessionToken(response.access_token, apiVersion, response.instance_url);
  
  		  if (postLoginCallback) postLoginCallback(postLoginAttr);
      } else {
          alert("AuthenticationError: No Token");
      }
  }
  
  function popupCenter(url, title, w, h) {
      // Handles dual monitor setups
      var parentLeft = window.screenLeft ? window.screenLeft : window.screenX;
      var parentTop = window.screenTop ? window.screenTop : window.screenY;
      var left = parentLeft + (window.innerWidth / 2) - (w / 2);
      var top = parentTop + (window.innerHeight / 2) - (h / 2);
      return window.open(url, title, 'width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
  }
  
  function createCandidate() {
  
  	profile.find(".force-loader").show();
  
  	var candidateJSON = {
  		"Name": profile.find(".company-name").text().trim(),
  		"Phone_Number__c": profile.find(".company-tel").text().trim(),
  		"Fax__c": profile.find(".company-fax").text().trim(),
  		"URL__c": profile.find(".company-url").text().trim(),
  		"Linkedin__c": profile.find(".company-linkedin").text().trim(),
  		"Facebook__c": profile.find(".company-facebook").text().trim(),
  		"Twitter__c": profile.find(".company-twitter").text().trim(),
  		"Founded_Year__c": profile.find(".company-year").text().trim(),
  		"Revenue__c": profile.find(".company-revenue").text().trim(),
  		"Number_of_Employees__c": profile.find(".company-employees").text().trim(),
  		"Business_Type__c": profile.find(".company-types").text().trim(),
  		"Description__c": profile.find(".company-description").text().trim(),
  		"Address__c": profile.find(".company-address").text().trim(),
  		"Country_Code__c": profile.find(".company-country").text().trim(),
  		"Tags__c": profile.find(".company-tags").text().trim(),
  		"SIC_Code__c": profile.find(".company-sic").text().trim(),
  		"NAICS_Code__c": profile.find(".company-naics").text().trim()
  	};
  
  	var showcaseId = profile.attr('id');
  
    client.upsert('Candidate_Non_Member__c',
  		'Showcase_ID__c', 
  		showcaseId, 
  		candidateJSON,
        function (data) {
            console.log(data);
  			if (data) {
  				lookupPotentialMatch(data.id);
  			} else {
			    lookupCandidate(showcaseId);
  			}
        },
        function (err) {
            console.log(err.responseText);
  			
  			// Old token, need to login
  			if (err && err.status && err.status == '401') {
  				$.cookie('access_token', '', {expires: 1, secure: true});
  				$.cookie('instance_url', '', {expires: 1, secure: true});
  				login(createCandidate, profile);
  			} else {
  				profile.find('.alert-warning').show();
  				profile.find(".force-loader").hide();
  			}
        });
  
  }
  
  function lookupCandidate(showcaseId) {
  	client.query("SELECT Id FROM Candidate_Non_Member__c WHERE Showcase_ID__c = " + showcaseId + " LIMIT 1",
  		function(response) {
  			console.log(response);
  			if (response.records.length > 0) {
  				var candidateIdSalesForce = response.records[0].Id;
  				createPotentialMatch(candidateIdSalesForce);
  			} else {
  				profile.find('.alert-warning').show();
  				profile.find(".force-loader").hide();
  			}
  	    },
  		function(err) {
  			console.log(err.responseText);
  			profile.find(".force-loader").hide();
    	}
  	);
  }
  
  function lookupPotentialMatch(candidateIdSalesForce) {
  
    linxId = getLinxId();
  
  	client.query("SELECT Id FROM LINX__c WHERE Linx_ID__c = '" + linxId + "' LIMIT 1",
  		function(response) {
  			console.log(response);
  			if (response.records.length > 0) {
  				var linxIdSalesForce = response.records[0].Id;
  				createPotentialMatch(linxIdSalesForce, candidateIdSalesForce);
  			} else {
  				profile.find('.alert-warning').text("The Linx ID provided does not exists").show();
  				profile.find(".force-loader").hide();
  			}
  	    },
  		function(err) {
  			console.log(err.responseText);
			profile.find(".force-loader").hide();
    	}
  	);
  }
  
  function createPotentialMatch(linxIdSalesForce, candidateIdSalesForce) {
  	
  	var query = $('input[name="query"]').val();
  	var batchId = $.cookie("batchNumber");
  
  	var potentialMatchJSON = {
  		"Candidate__c": candidateIdSalesForce,
  		"Linx__c": linxIdSalesForce,
  		"Batch__c": batchId,
  		"Query__c": query,
  		"Query_url__c": window.location.href
  	};
  
  	client.create('Potential_Match__c',
  		potentialMatchJSON,
  		function(data) {
  			console.log(data);
  			profile.find(".force-loader").hide();
			profile.find('.alert-success').show();
  		},
  		function(err) {
  			console.log(err.responseText);
  			profile.find(".force-loader").hide();
  			profile.find('.alert-warning').text("Error: this candidate has already been saved as potential match").show();
  		}
  	);
  }
  
  function getLinxId() {
    var linxId = $.cookie("linxId");
  
	if (!linxId) {
  		$('#setup-linx-popup').modal('show');
    }
  
  	return linxId;
  }
  
  $(document).load(function() {
  	client = new forcetk.Client(clientId, loginUrl, proxyURL);
  });
  
  $(document).ready(function() {
  
  	$(".save-candidate-btn, .save-candidate-top-btn").on('click', function(e) {
  		e.preventDefault();
  
  		var button = e.currentTarget;
  		profile = $(button).closest('.modalHue');
  
  		login(createCandidate);
  	});
  
  	$(".modalHue.mini-profile").on("show.bs.modalHue", function() {
  		removeUselessSections();
  		return true;
  	});
  
    $("#setup-linx-popup .save-btn").on("click", function() {
  		var linxId = $("#setup-linx-popup .modalHue-body #linx-id").val();
  		var batchNumber = $("#setup-linx-popup .modalHue-body #batch-number").val();
  
  		if (!batchNumber) {
  			batchNumber = "1";
  		}
  
  		$.cookie("linxId", linxId);
  		$.cookie("batchNumber", batchNumber);
  		$("#setup-linx-popup").modalHue("hide");
    });

  });

  // Custom Modal.js from Bootstrap
  //+function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b),this.$backdrop=this.isShown=null,this.options.remote&&this.$element.find(".modalHue-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modalHue")},this))};b.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},b.prototype.toggle=function(a){return this[this.isShown?"hide":"show"](a)},b.prototype.show=function(b){var c=this,d=a.Event("show.bs.modalHue",{relatedTarget:b});this.$element.trigger(d);if(this.isShown||d.isDefaultPrevented())return;this.isShown=!0,this.escape(),this.$element.on("click.dismiss.bs.modalHue",'[data-dismiss="modalHue"]',a.proxy(this.hide,this)),this.backdrop(function(){var d=a.support.transition&&c.$element.hasClass("fade");c.$element.parent().length||c.$element.appendTo(document.body),c.$element.show().scrollTop(0),d&&c.$element[0].offsetWidth,c.$element.addClass("in").attr("aria-hidden",!1),c.enforceFocus();var e=a.Event("shown.bs.modalHue",{relatedTarget:b});d?c.$element.find(".modalHue-dialog").one(a.support.transition.end,function(){c.$element.focus().trigger(e)}).emulateTransitionEnd(300):c.$element.focus().trigger(e)})},b.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modalHue"),this.$element.trigger(b);if(!this.isShown||b.isDefaultPrevented())return;this.isShown=!1,this.escape(),a(document).off("focusin.bs.modalHue"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.bs.modalHue"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one(a.support.transition.end,a.proxy(this.hidemodalHue,this)).emulateTransitionEnd(300):this.hidemodalHue()},b.prototype.enforceFocus=function(){a(document).off("focusin.bs.modalHue").on("focusin.bs.modalHue",a.proxy(function(a){this.$element[0]!==a.target&&!this.$element.has(a.target).length&&this.$element.focus()},this))},b.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.bs.modalHue",a.proxy(function(a){a.which==27&&this.hide()},this)):this.isShown||this.$element.off("keyup.dismiss.bs.modalHue")},b.prototype.hidemodalHue=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden.bs.modalHue")})},b.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},b.prototype.backdrop=function(b){var c=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var d=a.support.transition&&c;this.$backdrop=a('<div class="modalHue-backdrop '+c+'" />').appendTo(document.body),this.$element.on("click.dismiss.bs.modalHue",a.proxy(function(a){if(a.target!==a.currentTarget)return;this.options.backdrop=="static"?this.$element[0].focus.call(this.$element[0]):this.hide.call(this)},this)),d&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in");if(!b)return;d?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()):b&&b()};var c=a.fn.modalHue;a.fn.modalHue=function(c,d){return this.each(function(){var e=a(this),f=e.data("bs.modalHue"),g=a.extend({},b.DEFAULTS,e.data(),typeof c=="object"&&c);f||e.data("bs.modalHue",f=new b(this,g)),typeof c=="string"?f[c](d):g.show&&f.show(d)})},a.fn.modalHue.Constructor=b,a.fn.modalHue.noConflict=function(){return a.fn.modalHue=c,this},a(document).on("click.bs.modalHue.data-api",'[data-toggle="modalHue"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("bs.modalHue")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());c.is("a")&&b.preventDefault(),e.modalHue(f,this).one("hide",function(){c.is(":visible")&&c.focus()})}),a(document).on("show.bs.modalHue",".modalHue",function(){a(document.body).addClass("modalHue-open")}).on("hidden.bs.modalHue",".modalHue",function(){a(document.body).removeClass("modalHue-open")})}(jQuery)
  
  /* ========================================================================
 * Bootstrap: modalHue.js v3.1.1
 * http://getbootstrap.com/javascript/#modalHues
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // modalHue CLASS DEFINITION
  // ======================

  var modalHue = function (element, options) {
    this.options   = options
    this.$element  = $(element)
    this.$backdrop =
    this.isShown   = null

    if (this.options.remote) {
      this.$element
        .find('.modalHue-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modalHue')
        }, this))
    }
  }

  modalHue.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  modalHue.prototype.toggle = function (_relatedTarget) {
    return this[!this.isShown ? 'show' : 'hide'](_relatedTarget)
  }

  modalHue.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modalHue', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.escape()

    this.$element.on('click.dismiss.bs.modalHue', '[data-dismiss="modalHue"]', $.proxy(this.hide, this))

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(document.body) // don't move modalHues dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element
        .addClass('in')
        .attr('aria-hidden', false)

      that.enforceFocus()

      var e = $.Event('shown.bs.modalHue', { relatedTarget: _relatedTarget })

      transition ?
        that.$element.find('.modalHue-dialog') // wait for modalHue to slide in
          .one($.support.transition.end, function () {
            that.$element.focus().trigger(e)
          })
          .emulateTransitionEnd(300) :
        that.$element.focus().trigger(e)
    })
  }

  modalHue.prototype.hide = function (e) {
  if (e) e.preventDefault()

    e = $.Event('hide.bs.modalHue')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.escape()

    $(document).off('focusin.bs.modalHue')

    this.$element
      .removeClass('in')
      .attr('aria-hidden', true)
      .off('click.dismiss.bs.modalHue')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one($.support.transition.end, $.proxy(this.hidemodalHue, this))
        .emulateTransitionEnd(300) :
      this.hidemodalHue()
  }

  modalHue.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modalHue') // guard against infinite focus loop
      .on('focusin.bs.modalHue', $.proxy(function (e) {
        if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
          this.$element.focus()
        }
      }, this))
  }

  modalHue.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keyup.dismiss.bs.modalHue', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keyup.dismiss.bs.modalHue')
    }
  }

  modalHue.prototype.hidemodalHue = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.removeBackdrop()
      that.$element.trigger('hidden.bs.modalHue')
    })
  }

  modalHue.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  modalHue.prototype.backdrop = function (callback) {
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modalHue-backdrop ' + animate + '" />')
        .appendTo(document.body)

      this.$element.on('click.dismiss.bs.modalHue', $.proxy(function (e) {
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus.call(this.$element[0])
          : this.hide.call(this)
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one($.support.transition.end, callback)
          .emulateTransitionEnd(150) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one($.support.transition.end, callback)
          .emulateTransitionEnd(150) :
        callback()

    } else if (callback) {
      callback()
    }
  }


  // modalHue PLUGIN DEFINITION
  // =======================

  var old = $.fn.modalHue

  $.fn.modalHue = function (option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modalHue')
      var options = $.extend({}, modalHue.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modalHue', (data = new modalHue(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  $.fn.modalHue.Constructor = modalHue


  // modalHue NO CONFLICT
  // =================

  $.fn.modalHue.noConflict = function () {
    $.fn.modalHue = old
    return this
  }


  // modalHue DATA-API
  // ==============

  $(document).on('click.bs.modalHue.data-api', '[data-toggle="modalHue"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
    var option  = $target.data('bs.modalHue') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target
      .modalHue(option, this)
      .one('hide', function () {
        $this.is(':visible') && $this.focus()
      })
  })

  $(document)
    .on('show.bs.modalHue', '.modalHue', function () { $(document.body).addClass('modalHue-open') })
    .on('hidden.bs.modalHue', '.modalHue', function () { $(document.body).removeClass('modalHue-open') })

}(jQuery);

/* ========================================================================
 * Bootstrap: transition.js v3.1.1
 * http://getbootstrap.com/javascript/#transitions
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd',
      'MozTransition'    : 'transitionend',
      'OTransition'      : 'oTransitionEnd otransitionend',
      'transition'       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }

    return false // explicit for ie8 (  ._.)
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false, $el = this
    $(this).one($.support.transition.end, function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()
  })

}(jQuery);
