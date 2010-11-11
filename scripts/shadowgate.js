$(function() {
  var $game = $("#game"),
      $interface = $("#interface"),
      $inventory = $("#inventory"),
      $stage = $("#stage"),
      $dialog = $("#dialog"),
      $dialog_layer = $("#dialog_layer"),
      inventory = [];
  var images = [
    "1_key.gif",
    "1_open-door.gif",
    "1_skull.gif",
    "1.gif",
    "2_door1.gif",
    "2_door2.gif",
    "2_rug.gif",
    "2_torch.gif",
    "2.gif",
    "bg_dialog.gif",
    "bg_interface.gif",
    "bg_inventory.jpg",
    "bg_view-frame.gif",
    "icon_pen.gif",
    "torch_large.gif",
    "title.gif"
  ];
  var remaining_images = images.length;
  var action = "default";
  var stages = {
    "1": {
      skull: {
        "default": function() { $(this).trigger("look"); },
        look: function() {
          dialog([
            "It's the skull of some",
            "creature. Its meaning",
            "seems quite clear: death",
            "lurks inside."]);
        },
        open: function() {
          var $e = $(this);
          if ($stage.hasClass("s1")) {
            dialog(["As if by magic, the", "skull rises."]);
            $stage.removeClass().addClass("s1_alt");
            $e.animate({
              top: parseInt($e.css("top"), 10) - 32
            }, 1500);
          }
          else { dialog("The skull is opened."); }
        },
        close: function(e) {
          var $e = $(this);
          if ($stage.hasClass("s1_alt")) {
            $e.animate({
              top: parseInt($e.css("top"), 10) + 32
            }, 1500, function() {
              $stage.removeClass().addClass("s1");
              dialog("The skull is closed.");
            });
          }
          else { dialog("The skull is closed."); }
        }
      },
      key1: {
        "default": function() { $(this).trigger("look"); },
        look: function() { dialog("it's a small iron key."); },
        take: function() {
          inventory.push({
            id: "key 1",
            use: function() {
              dialog(["What do you want to", "use this on?"]);
              $(this).addClass("active");
            },
            look: function() { dialog("it's a small iron key."); }
          });
          $(this).remove();
          dialog("The key 1 is in hand.");
          updateInventory(inventory[inventory.length - 1], true);
        }
      },
      door: {
        "default": function() { door($(this), "s2"); },
        look: function() {
          dialog([
            "It's a heavy wooden door",
            "with iron hinges."
          ]);
        },
        open: function() { $(this).trigger("default"); },
        move: function() { $(this).trigger("default"); }
      }
    },
    "2": {
      torch1: {
        "default": function() { $(this).trigger("look"); },
        look: function() { dialog("It's a torch."); },
        take: function() { torch($(this)); }
      },
      torch2: {
        "default": function() { $(this).trigger("look"); },
        look: function() { dialog("It's a torch."); },
        take: function() { torch($(this)); }
      },
      door1: {
        "default": function() { dialog("The door is locked."); },
        open: function() {
          if (stages["2"].door1.unlocked) { door($(this), "s3"); }
          else {
            if (action === "use key 1") {
              door($(this), "s3");
              stages["2"].door1.unlocked = true;
            }
            else { $(this).trigger("default"); }
          }
        },
        use: function() {
          if ($inventory.find(".active").attr("title") !== "key 1") {
            dialog(["You seem to be wasting", "your time."]);
          }
          else {
            stages["2"].door1.unlocked = true;
            $(this).trigger("open");
          }
        },
        look: function() {
          dialog([
            "This wooden door is",
            "reinforced with heavy",
            "sheets of steel."
          ]);
        }
      },
      door2: {
        "default": function() { door($(this), "s4"); },
        open: function() { $(this).trigger("default"); }
      },
      rug: {
        "default": function() { dialog(["It's a beautifully woven", "rug."]); },
        look: function() { dialog(["It's a beautifully woven", "rug."]); },
        use: function() {
          if ($inventory.find(".active").attr("title") === "torch") {
            dialog(["The rug quickly catches", "on fire and burns away."]);
            $(this).remove();
          }
          else { dialog(["You seem to be wasting", "your time."]); }
        },
        take: function() { dialog("You can't take it!"); },
        open: function() { dialog("It won't open!"); },
        close: function() { dialog("Nothing happened."); },
        hit: function() { dialog("Nothing happened."); },
        leave: function() { dialog("You can't drop it here."); },
        speak: function() { dialog(["What you expected hasn't", "happened"]); }
      }
    }
  };

  $interface.find("a").click(function() {
    var $e = $(this);
    $interface.find("a").not($e).removeClass("active");
    $e.toggleClass("active");
    action = ($e.hasClass("active")) ? $e.attr("id") : "default";
    return false;
  }).each(function() {
    $("<span />").appendTo($(this));
  });
  for (var i in images) {
    var img = new Image();
    img.src = "images/" + images[i];
    img.onload = function() { remaining_images--; }
  }
  var load_indicator = function() {
    if (remaining_images) {
      var percent = Math.floor((images.length - remaining_images) / images.length) * 100;
      $("#progress").find(".text").text(percent).end().find("complete").css("width", percent);
      setTimeout(function() { load_indicator(); }, 34);
    }
    else {
      $("#loading").remove();
      $game.removeClass().addClass("title").bind("click.title", function(e) {
        $(this).unbind(e).removeClass();
        $interface.show();
        $inventory.show();
        $("#view-frame").show();
        $stage.addClass("s1").show();
        stageSetup();
      });
    }
  };
  load_indicator();

  function stageSetup() {
    var s = stages[$stage[0].className.match(/\d/g).join(",")];
    $stage.empty();
    for (var v in s) {
      var $div = $("<div />").attr({
        "class": v
      }).bind("click", function() {
        $(this).trigger(action);
      }).appendTo($stage);
      for (var e in s[v]) {
        $div.bind(e, s[v][e]);
      }
    }
  }

  function torch($e) {
    if ($.inArray("torch", inventory) < 0) {
      inventory.push("torch");
    }
    dialog("The torch is in hand.");
    $e.remove();
  }

  function door($e, destination) {
    if ($e.hasClass("open")) {
      $stage.removeClass().addClass(destination);
      stageSetup();
    }
    else {
      $e.addClass("open");
    }
  }

  function convertText(str, $e) {
    var chars = str.toLowerCase().split(""),
        $p = $("<p />"),
        digits_and_punct = {
          "222": "quote",
          "46": "period",
          "58": "colon",
          "49": "exclamation",
          "32": "space",
          "39": "apostrophe"
        };
    for (var l in chars) {
      var code = chars[l].charCodeAt(0),
          klass;
      //console.log(chars[l], code);
      if (code < 123 && code > 96) { klass = chars[l]; }
      else if (digits_and_punct.hasOwnProperty(code)) { klass = digits_and_punct[code]; }
      else { klass = "space"; }
      $("<span />").addClass(klass).appendTo($p);
    }
    $p.appendTo($e);
  }

  function dialog(txt) {
    if (typeof txt === "object") {
      for (var i in txt) {
        convertText(txt[i], $dialog);
      }
    }
    else {
      convertText(txt, $dialog);
    }
    $dialog.show();
    $dialog_layer.show().bind("click.complete_text", function(e) {
      clearTimeout(runner);
      var $spans = $dialog.find("span"),
          hidden = 0;
      $spans.each(function() {
        if ($(this).is(":hidden")) { hidden++; }
      });
      if (hidden) {
        $dialog.find("span").show();
        $dialog_layer.unbind(e).bind("click.hide_dialog", function(e) {
          $dialog.html("").hide()
          $dialog_layer.hide().unbind(e);
        });
      }
      else {
        $dialog.html("").hide()
        $dialog_layer.hide().unbind(e);
      }
    });
    var s = 0,
        $spans = $dialog.find("span"),
        runner;
    var showSpan = function() {
      $spans.eq(s).show();
      if (s !== $spans.length - 1) {
        s++;
        runner = setTimeout(function() { showSpan(); }, 50);
      }
    };
    showSpan();
  }

  function updateInventory(item, adding) {
    if (adding) {
      var $item = $("<li />").attr({
        title: item.id
      }).bind("click", function() {
        $(this).trigger(action);
      }).appendTo($inventory.find("ul"));
      for (var v in item) {
        if (v !== "id") {
          $item.bind(v, item[v]);
        }
      }
      convertText(item.id, $item);
      $item.find("span").show();
    }
  }

  function random(max, min) {
    min = min || 0;
    return min + Math.floor(Math.random() * max);
  }
});