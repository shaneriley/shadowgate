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
  var digits_and_punct = {
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
    "222": "quote",
    "46": "period",
    "58": "colon",
    "33": "exclamation",
    "32": "space",
    "39": "apostrophe"
  };
  var remaining_images = images.length;
  var action = "default";
  var defaults = {
    nothing: function() { dialog("Nothing happened."); },
    no_take: function() { dialog("You can't take it!"); },
    no_open: function() { dialog("It won't open!"); },
    no_use: function() { dialog(["You can't use what you", "didn't take."]); },
    no_leave: function() { dialog(["You can't drop what you", "didn't take."]); },
    no_speak: function() { dialog(["What you expected hasn't", "happened"]); },
    torch: {
      look: function() { dialog([
        "It's a torch. An oil",
        "soaked rag is wrapped",
        "around it."]);
      }
    }
  };
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
        take: defaults.no_take,
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
        },
        use: defaults.nothing,
        hit: defaults.nothing,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      key1: {
        "default": function() { $(this).trigger("look"); },
        look: function() { dialog("it's a small iron key."); },
        take: function() {
          inventory.push({
            id: "key 1",
            interacts_with: {
              ".s2 .door1": null,
              ".s2 .door2": function() { dialog("Wrong door."); },
              "default": function() {
                dialog(["You can't seem to find a", "keyhole."]);
              }
            },
            use: function() {
              dialog(["What do you want to", "use this on?"]);
              $(this).addClass("active");
              var obj = $(this).data("obj");
              defaultInventoryAction(obj.interacts_with);
            },
            look: function() { dialog("it's a small iron key."); }
          });
          $(this).remove();
          dialog("The key 1 is in hand.");
          updateInventory(inventory[inventory.length - 1], true);
        },
        leave: defaults.no_leave
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
        close: function() { $(this).closeDoor(); },
        move: function() { $(this).trigger("default"); },
        leave: defaults.no_leave,
        take: defaults.no_take
      }
    },
    "2": {
      torch1: new Torch(),
      torch2: new Torch(),
      door1: {
        "default": function() {
          var $e = $(this);
          ($e.data("obj").unlocked) ? door($e, "s4") : dialog("The door is locked.");
        },
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
        },
        close: function() { $(this).closeDoor(); }
      },
      door2: {
        "default": function() {
          var $e = $(this);
          ($e.data("obj").unlocked) ? door($e, "s4") : dialog("The door is locked.");
        },
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
        take: defaults.no_take,
        open: defaults.no_open,
        close: defaults.nothing,
        hit: defaults.nothing,
        leave: function() { dialog("You can't drop it here."); },
        speak: defaults.no_speak
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
  $interface.find("a#save").click(saveGame);

  function Interactive() {
    return {
      nothing: function() { dialog("Nothing happened."); },
      take: function() { dialog("You can't take it!"); },
      open: function() { dialog("It won't open!"); },
      use: function() { dialog(["You can't use what you", "didn't take."]); },
      leave: function() { dialog(["You can't drop what you", "didn't take."]); },
      speak: function() { dialog(["What you expected hasn't", "happened"]); }
    };
  }
  function Torch() {
    var t = new Interactive();
    t.look = function() { dialog([
      "It's a torch. An oil",
      "soaked rag is wrapped",
      "around it."]);
    };
    t.take = function() { torch($(this)); };
    t.close = t.hit = t.nothing;
    return t;
  }

  function stageSetup(stage) {
    var s = stages[stage] || stages[$stage[0].className.match(/\d/g).join(",")];
    $stage.empty();
    for (var v in s) {
      var $div = $("<div />").attr({
        "class": v
      }).bind("click", function() {
        $(this).trigger(action);
      }).data("obj", s[v]).appendTo($stage);
      for (var e in s[v]) {
        $div.bind(e, s[v][e]);
      }
    }
  }

  function torch($e) {
    var nonexistent = true;
    for (var i in inventory) {
      if (inventory[i].id === "torch") {
        nonexistent = false;
        inventory[i].count++;
        var $i = $inventory.find("li[title=torch]");
        $i.find("p span:eq(6)").removeClass().addClass(digits_and_punct[inventory[i].count]);
      }
    }
    if (nonexistent) {
      inventory.push({
        id: "torch",
        count: 1,
        use: function() {
          dialog("The torch is lit.");
          for (var i in inventory) {
            if (inventory[i].id === "torch") {
              if (inventory[i].count != 1) {
                inventory[i].count--;
                $(this).find("p span:eq(6)").removeClass().addClass(digits_and_punct[inventory[i].count]);
              }
              else {
                updateInventory(inventory[i], false);
                var left = inventory.slice(0, i + 1),
                    right = inventory.slice(i + 1);
                inventory = left.concat(right);
              }
            }
          }
        },
        look: function() { dialog("It's an unlit torch."); }
      });
      updateInventory(inventory[inventory.length - 1], true);
      var $p = $inventory.find("li[title=torch] p");
      $("<span />", {"class": "equal"}).appendTo($p).show();
      $("<span />", {"class": "one"}).appendTo($p).show();
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
      dialog("The door is opened.");
    }
  }

  function functionToString(obj) {
    for (var i in obj) {
      if (typeof obj[i] === "object") { obj[i] = functionToString(obj[i]); }
      else if (typeof obj[i] === "function") { obj[i] = obj[i].toString(); }
    }
    return obj;
  }

  function stringToFunction(obj) {
    for (var i in obj) {
      if (typeof obj[i] === "object") { obj[i] = stringToFunction(obj[i]); }
      else if (typeof obj[i] === "string") {
        if (/function/.test(obj[i])) {
          obj[i] = eval("(" + obj[i] + ")");
        }
      }
    }
    return obj;
  }

  function saveGame() {
    var state = {};
    state.stage = stages[$stage[0].className.match(/\d/g).join(",")];
    state.inventory = inventory;
    state.torches = {
      left: $inventory.find("a.torch.left")[0].className,
      right: $inventory.find("a.torch.right")[0].className
    };
    for (var i in state.inventory) {
      var item = state.inventory[i];
      for (var q in item) {
        if (typeof item[q] === "function") { item[q] = item[q].toString(); }
      }
    }
    functionToString(state);
    localStorage.setObject("shadowgate", state);
    dialog("Progress saved.");
    $interface.find("#save").removeClass("active");
  }

  function loadGame() {
    var state = stringToFunction(localStorage.getObject("shadowgate"));
    if (state) {
      stageSetup(state.stage);
      $inventory.find("ul").append(state.inventory);
      with (state.torches) {
        $inventory.find("a.torch.left").addClass(left);
        $inventory.find("a.torch.right").addClass(right);
      }
    }
  }

  (function($) {
    $.fn.closeDoor = function() {
      dialog("The door is closed.");
      return this.removeClass("open");
    };
  })(jQuery);

  function convertText(str, $e) {
    var chars = str.toLowerCase().split(""),
        $p = $("<p />");
    for (var l in chars) {
      var code = chars[l].charCodeAt(0),
          klass;
      if (!isNaN(parseInt(chars[l], 10))) { code = parseInt(chars[l], 10); }
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
          $dialog.html("").hide();
          $dialog_layer.hide().unbind(e);
        });
      }
      else {
        $dialog.html("").hide();
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
      }).data("obj", item).appendTo($inventory.find("ul"));
      for (var v in item) {
        if (typeof item[v] === "function") {
          $item.bind(v, item[v]);
        }
      }
      convertText(item.id, $item);
      $("<span />", {"class": "status"}).prependTo($item);
      $item.find("span").show();
    }
    else {
      $inventory.find("ul li[title=" + item.id + "]").remove();
    }
  }

  function random(max, min) {
    min = min || 0;
    return min + Math.floor(Math.random() * max);
  }

  function defaultInventoryAction(obj) {
    $(document).bind("click.use_item", function(e) {
      for (var i in obj) {
        if ($(e.target)[0] === $(i)[0]) {
          obj.interacted = true;
          if (typeof obj[i] === "function") {
            obj[i]();
          }
        }
      }
      if (obj.interacted) {
        e.preventDefault();
        e.stopPropagation();
        $(document).unbind(e);
        document.use_item_fired = false;
        $inventory.find(".active").removeClass("active");
        obj.interacted = false;
      }
      else {
        if ($dialog_layer.is(":visible")) { return false; }
        else if (!document.use_item_fired) { document.use_item_fired = true; }
        else {
          e.preventDefault();
          e.stopPropagation();
          $(document).unbind(e);
          obj["default"]();
          document.use_item_fired = false;
          $inventory.find(".active").removeClass("active");
        }
      }
      return false;
    });
  }

  Storage.prototype.setObject = function(key, value) { this.setItem(key, JSON.stringify(value)); };
  Storage.prototype.getObject = function(key) { return JSON.parse(this.getItem(key)); };
});