$(function() {
  var $game = $("#game"),
      $interface = $("#interface"),
      $inventory = $("#inventory"),
      $stage = $("#stage"),
      $dialog = $("#dialog"),
      $dialog_layer = $("#dialog_layer"),
      $move_grid = $("#move_grid"),
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
    "32": "space",
    "33": "exclamation",
    "34": "quote",
    "39": "apostrophe",
    "44": "comma",
    "46": "period",
    "58": "colon",
    "63": "question"
  };
  var remaining_images = images.length;
  var action = "default";
  var defaults = {
    nothing: function() { dialog("Nothing happened."); },
    wasting_time: function() { dialog(["You seem to be wasting", "your time."]); },
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
    },
    ouch: function() { dialog("Ouch! That smarts!"); }
  };

  var inventory_item = {
    "key 1": {
      id: "key 1",
      interacts_with: {
        ".s2 .door1": null,
        ".s2 .door2": function() { dialog("Wrong door."); },
        "default": function() { dialog(["You can't seem to find a", "keyhole."]); }
      },
      use: function() { $(this).useItem(); },
      look: function() { dialog("it's a small iron key."); }
    },
    "torch": {
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
    },
    "torch_special": {
      id: "torch"
    },
    "key 2": {
      id: "key 2",
      interacts_with: {
        ".s2 .door2": null,
        ".s2 .door1": function() { dialog("Wrong door."); },
        "default": function() { dialog(["You can't seem to find a", "keyhole."]); }
      },
      use: function() { $(this).useItem(); },
      look: function() { dialog("it's a small iron key."); }
    },
    sword: {
      id: "sword",
      look: function() {
        dialog(["It's a double-edged", "broadsword. The handle", "has druidic script", "written upon it."]);
      }
    },
    sling: {
      id: "sling",
      look: function() {
        dialog(["It's a small leather", "sling. This would come", "in handy for long-range", "battles!"]);
      }
    },
    arrow: {
      id: "arrow",
      look: function() {
        dialog(["A finely crafted silver", "arrow is not uncommon in", "the elven lands."]);
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
            }, 1500, function() {
              $(this).addClass("open");
              stages["1"].skull["class"] = "open";
              stages["1"]["class"] = "s1_alt";
            });
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
          inventory.push(inventory_item["key 1"]);
          deleteItem($(this).remove());
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
      },
      move: [{ door: "door", s: "s2" , x: 2, y: 0}],
      first_dialog: [
        "The last thing that you", "remember is standing", "before the wizard lakmir", "as he waved his hands.",
        "Now you find yourself", "staring at an entryway", "which lies at the edge", "of a forest.",
        "The druid's words ring", "in your ears: \"within", "the castle Shadowgate", "lies your quest.",
        "The dreaded warlock lord", "will use his black magic", "to raise the behemoth", "from the dark depths.",
        "The combination of his", "evil arts and the great", "titan's power will", "surely destroy us all!",
        "You are the last of the", "line of kings, the seed", "of prophecy that was", "foretold eons ago.",
        "Only you can stop the", "evil one from darkening", "our world forever! Fare", "thee well.\"",
        "Gritting your teeth, you", "swear by your God's name", "that you will destroy", "the warlock lord!"
      ],
      entrance_dialog: [
        "It's the entrance to", "Shadowgate. You can hear", "wolves howling deep in", "the forest behind you..."
      ]
    },
    "2": {
      torch1: new Torch(),
      torch2: new Torch(),
      door1: {
        "default": function() {
          var $e = $(this);
          ($e.data("obj").unlocked) ? door($e, "s3") : dialog("The door is locked.");
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
        open: function() { $(this).trigger("default"); },
        use: function() {
          if ($inventory.find(".active").attr("title") !== "key 2") {
            dialog(["You seem to be wasting", "your time."]);
          }
          else {
            stages["2"].door2.unlocked = true;
            $(this).trigger("open");
          }
        }
      },
      rug: {
        "default": function() { dialog(["It's a beautifully woven", "rug."]); },
        look: function() { $(this).trigger("default"); },
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
      },
      door_s1: {
        "default": function() { door($(this).addClass("open"), "s1"); },
        open: function() { $(this).trigger("default"); }
      },
      move: [
        { door: "door1", s: "s3", x: 2, y: 0 },
        { door: "door2", s: "s4", x: 4, y: 2 },
        { door: "door_s1", s: "s1", x: 2, y: 4 }
      ],
      first_dialog: [
        "\"That pitiful wizard", "Lakmir was a fool to", "send a buffoon like you", "to stop me.",
        "You will surely regret", "it for the only thing", "here for you is a", "horrible death!\"",
        "The sound of maniacal", "laughter echoes in your", "ears."
      ],
      first_before: function(txt) {
        $("<div />", {"class": "eyes"}).appendTo($stage);
        setTimeout(function() { $stage.find(".eyes").remove(); dialog(txt); }, 2000);
      },
      entrance_dialog: ["You stand in a long", "corridor. Huge stone", "archways line the entire", "hall."]
    },
    "3": {
      door: {
        "default": function() {
          var $e = $(this);
          door($e, "s5", ["The stone falls away to", "reveal a secret passage!"]);
          if (!$e.data("obj").opened) {
            $e.data("obj").opened = true;
            createMoveLocation({ door: "door", s: "s5", x: 1, y: 0 });
          }
        },
        look: function() { dialog("It's a stone wall."); },
        take: defaults.no_take,
        close: function() { dialog("The wall is closed."); },
        use: defaults.wasting_time,
        hit: function() { $(this).trigger("default"); },
        leave: defaults.wasting_time,
        speak: defaults.no_speak,
        opened: false
      },
      torch1: {
        "default": function() { $(this).trigger("look"); },
        look: function() {
          var el = $(this)[0];
          if (el.looked) { dialog("It's a strange torch."); }
          else {
            dialog([
              "There is something out",
              "of the ordinary about",
              "this torch but you can't",
              "put a finger on it."
            ]);
          }
          el.looked = true;
        },
        take: function() {
          inventory.push(inventory_item["torch_special"]);
          deleteItem($(this).remove());
          dialog("The torch is in hand.");
          updateInventory(inventory[inventory.length - 1], true);
        },
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.no_use,
        hit: defaults.nothing,
        leave: defaults.no_leave,
        speak: defaults.no_speak,
      },
      torch2: new Torch(),
      hall: {
        "default": function() { $inventory.find(".page.book").remove(); }
      },
      book: {
        "default": function() {
          dialog([
            "It's an ancient tome.",
            "It seems that no one has",
            "disturbed its pages for",
            "centuries."
          ]);
        },
        look: function() { $(this).trigger("default"); },
        take: function() {
          $("<div />", {"class": "pit"}).appendTo($stage);
          dialog([
            "When you remove the book",
            "from its pedestal, the",
            "floor collapses, and you",
            "fall to your death."
          ], death);
        },
        open: function() {
          var $e = $(this);
          if ($e.hasClass("open")) { dialog("The book is opened."); }
          else {
            dialog(["The book is opened and", "examined.", "", "",
              "A rectangular hole has", "been cut out of the", "inside of the book."], function() {
              var $page = newInventoryPage("book");
              if (!$inventory.find("[title='key 2']").length) {
                var $item = $("<li />", {
                  title: "key 2",
                  click: function() {
                    $(this).trigger(action);
                  }
                }).bind("look", inventory_item["key 2"].look)
                .bind("take", function() {
                  inventory.push(inventory_item["key 2"]);
                  deleteItem($(this).remove());
                  dialog("The key 2 is in hand.");
                  updateInventory(inventory[inventory.length - 1], true);
                }).appendTo($page.find("> ul"));
                convertText("key 2", $item);
                $("<span />", {"class": "status"}).prependTo($item);
                $item.find("span").show();
              }
            });
          }
          $e.addClass("open");
        },
        close: function() {
          var $e = $(this);
          if ($e.hasClass("open")) {
            $e.removeClass("open");
            dialog("You closed the book.");
          }
          else { dialog("The book is closed."); }
          $inventory.find(".page.book").remove();
        },
        use: function() { $(this).trigger("take"); },
        hit: function() { $(this).trigger("take"); },
        leave: function() { $(this).trigger("take"); },
        speak: function() { $(this).trigger("take"); }
      },
      door_s2: {
        "default": function() {
          door($(this).addClass("open"), "s2");
          $inventory.find(".page.book").remove();
        },
        open: function() { $(this).trigger("default"); }
      },
      door_s6: {
        "default": function() {
          door($(this).addClass("open"), "s6");
          $inventory.find(".page.book").remove();
        },
        open: function() { $(this).trigger("default"); }
      },
      move: [
        { door: "door_s6", s: "s6", x: 3, y: 0 },
        { door: "door_s2", s: "s2", x: 2, y: 4 }
      ],
      entrance_dialog: ["The stone passage winds", "to an unseen end."],
      first_dialog: ["The stone walls seem", "uncomfortably close as", "you walk down the stairs."]
    },
    "4": {
      sword: {
        "default": function() { inventory_item.sword.look(); },
        look: function() { $(this).trigger("default"); },
        take: function() {
          inventory.push(inventory_item.sword);
          deleteItem($(this).remove());
          dialog("The sword is in hand.");
          updateInventory(inventory[inventory.length - 1], true);
        },
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.no_use,
        hit: defaults.nothing,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      sling: {
        "default": function() { inventory_item.sling.look(); },
        look: function() { $(this).trigger("default"); },
        take: function() {
          inventory.push(inventory_item.sling);
          deleteItem($(this).remove());
          dialog("The sling was taken.");
          updateInventory(inventory[inventory.length - 1], true);
        },
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.no_use,
        hit: defaults.nothing,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      door_s2: {
        "default": function() { door($(this).addClass("open"), "s2"); },
        open: function() { $(this).trigger("default"); }
      },
      move: [{ door: "door_s2", s: "s2", x: 2, y: 4}],
      entrance_dialog: ["You are in a small", "cramped closet."],
      first_dialog: ["Oh! As you enter, you", "can see a sword and", "a sling inside."]
    },
    "5": {
      door: {
        "default": function() {
          var $e = $(this);
          if ($(this).hasClass("open")) {
            door($(this), "s7");
          }
        },
        look: function() {
          //dialog();
        },
        open: function() { },
        close: function() { },
        move: function() { $(this).trigger("default"); },
        leave: defaults.no_leave,
        take: defaults.no_take
      },
      arrow: {
        "default": function() { inventory_item.arrow.look(); },
        look: function() { $(this).trigger("default"); },
        take: function() {
          inventory.push(inventory_item.arrow);
          deleteItem($(this).remove());
          dialog("The arrow is in hand.");
          updateInventory(inventory[inventory.length - 1], true);
        },
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.no_use,
        hit: defaults.nothing,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      ledge: {
        look: function() {
          dialog(["A slab of concrete rests", "upon two stone supports,", "some ten feet from the", "floor."]);
        },
        take: defaults.no_take,
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.nothing,
        hit: defaults.ouch,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      torch_l: {
        "default": function() {
          dialog(["This torch seems to be", "fastened to the wall", "with rather modern", "looking nails."]);
        },
        look: function() { $(this).trigger("default"); },
        take: defaults.no_take,
        open: defaults.no_open,
        close: defaults.nothing,
        use: function() {
          var $e = $(this);
          dialog("You moved the torch.", function() {
            $e.addClass("used");
            $stage.find(".door").addClass("open");
            dialog(["It's a hidden door.", "There is a spiral", "staircase leading down."]);
          });
        },
        hit: defaults.ouch,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      torch_r: {
        "default": function() { dialog(["This torch is attached", "securely to the wall."]); },
        look: function() { $(this).trigger("default"); },
        take: defaults.no_take,
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.nothing,
        hit: defaults.ouch,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      rubble: {
        "default": function() {
          var $e = $(this);
          if ($e.hasClass("visible")) {
            dialog(["It's rubble from the", "broken ledge."]);
          }
        },
        look: function() { $(this).trigger("default"); },
        take: defaults.no_take,
        open: defaults.no_open,
        close: defaults.nothing,
        use: defaults.nothing,
        hit: defaults.ouch,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      door_ledge: {
        "default": function() {
          if ($stage.find(".ledge").hasClass("broken")) {
            dialog(["Hmm! It's too high for", "you to reach."]);
          }
          else {
            $stage.find(".ledge").addClass("broken");
            $stage.find(".rubble").addClass("visible");
            dialog(["The ledge wasn't strong",
              "enough to hold you.  You",
              "fall to the ground and",
              "land hard on your rump."
            ]);
          }
        },
        move: function() { $(this).trigger("default"); },
        look: function() { dialog("It is very dark."); },
        take: defaults.no_take,
        open: defaults.wasting_time,
        close: defaults.wasting_time,
        use: defaults.wasting_time,
        hit: defaults.nothing,
        leave: defaults.no_leave,
        speak: defaults.no_speak
      },
      move: [
        { door: "door_s3", s: "s3", x: 2, y: 4 },
        { door: "door_ledge", s: "", x: 2, y: 0 }
      ],
      first_dialog: ["As soon as you enter the", "room, you see an arrow", "on the front wall."],
      entrance_dialog: ["Cold air rushes into", "this chamber from an", "opening some ten feet", "above the floor."]
    },
    "6": {
      door_w: {
        "default": function() { door($(this), "s7"); },
        look: function() {
          dialog([
            "This door seems to be",
            "made of solid oak."
          ]);
        },
        open: function() { $(this).trigger("default"); },
        close: function() { $(this).closeDoor(); },
        move: function() { $(this).trigger("default"); },
        leave: defaults.no_leave,
        take: defaults.no_take
      },
      door_n: {
        "default": function() { door($(this), "s8"); },
        look: function() {
          dialog([
            "This door seems to be",
            "made of solid oak."
          ]);
        },
        open: function() { $(this).trigger("default"); },
        close: function() { $(this).closeDoor(); },
        move: function() { $(this).trigger("default"); },
        leave: defaults.no_leave,
        take: defaults.no_take
      },
      door_e: {
        "default": function() { door($(this), "s9"); },
        look: function() {
          dialog([
            "This door seems to be",
            "made of solid oak."
          ]);
        },
        open: function() { $(this).trigger("default"); },
        close: function() { $(this).closeDoor(); },
        move: function() { $(this).trigger("default"); },
        leave: defaults.no_leave,
        take: defaults.no_take
      },
      door_s3: {
        "default": function() { door($(this).addClass("open"), "s3"); },
        open: function() { $(this).trigger("default"); }
      },
      move: [
        { door: "door_s3", s: "s3", x: 2, y: 4 },
        { door: "door_w", s: "s7", x: 0, y: 2 },
        { door: "door_n", s: "s8", x: 2, y: 0 },
        { door: "door_e", s: "s9", x: 4, y: 2 }
      ],
      entrance_dialog: [
        "The stones in these", "walls were probably cut",
        "by the hands of enslaved", "mountain dwarves."
      ]
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
      $game.removeClass().addClass("title").one("click.title", function() {
        $(this).removeClass();
        $interface.show();
        $inventory.show();
        $("#view-frame").show();
        $stage.addClass("s1").show();
        if (localStorage.shadowgate) {
          loadGame();
        }
        else {
          stageSetup();
        }
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
    stage = stage || $stage[0].className.match(/\d/g).join(",");
    if (debug.hasOwnProperty("starting_screen")) { stage = debug.starting_screen; }
    var s = stages[stage],
        allowed_actions = [
          "default",
          "look",
          "take",
          "open",
          "close",
          "use",
          "hit",
          "leave",
          "speak"
        ];
    var createMoveGrid = function(grid) {
      for (var i in grid) {
        createMoveLocation(grid[i]);
      }
    };
    $stage.empty().removeClass().addClass(s["class"] || "s" + stage);
    $move_grid.empty();
    for (var v in s) {
      if (v === "move") {
        createMoveGrid(s[v]);
        continue;
      }
      else if (v === "entrance_dialog" && typeof s.before_dialog == "undefined" && s.revisit) { dialog(s[v]); }
      else if (v === "before_dialog" && s.revisit) { s[v](s.entrance_dialog); }
      else if (v === "first_dialog" && typeof s.first_before == "undefined") {
        dialog(s[v]);
        delete s[v];
        continue;
      }
      else if (v === "first_before") {
        s[v](s.first_dialog);
        delete s[v];
        delete s.first_dialog;
        continue;
      }
      var $div = $("<div />").attr({
        "class": v
      }).bind("click", function() {
        $(this).trigger(action);
      }).data("obj", s[v]).appendTo($stage);
      if (s[v]["class"]) { $div.addClass(s[v]["class"]); }
      for (var e in s[v]) {
        if (allowed_actions.indexOf(e) >= 0) { $div.bind(e, s[v][e]); }
      }
    }
    s.revisit = true;
  }

  function createMoveLocation(data) {
    return $("<a />", {
      href: "#",
      css: {
        left: data.x * 21,
        top: data.y * 21
      }
    }).click({marker: data}, function(e) {
      $stage.find("." + e.data.marker.door).trigger("open");
      return false;
    }).appendTo($move_grid);
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
      inventory.push(inventory_item.torch);
      updateInventory(inventory[inventory.length - 1], true);
    }
    dialog("The torch is in hand.");
    $e.remove();
    deleteItem($e);
  }

  function door($e, destination, text) {
    if ($e.hasClass("open")) {
      $stage.removeClass().addClass(destination);
      stageSetup();
    }
    else {
      $e.addClass("open");
      $e.data("obj")["class"] = "open";
      dialog(text || "The door is opened.");
    }
  }

  function deleteItem($e) {
    delete stages[$stage[0].className.match(/\d/g).join(",")][$e[0].className];
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
    state.stage = $stage[0].className.match(/\d/g).join(",");
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
      inventory = state.inventory;
      for (var i in inventory) {
        updateInventory(inventory[i], true);
      }
      with (state.torches) {
        $inventory.find("a.torch.left").addClass(left);
        $inventory.find("a.torch.right").addClass(right);
      }
    }
    else {
      stageSetup();
    }
  }

  (function($) {
    $.fn.closeDoor = function() {
      dialog("The door is closed.");
      delete this.data("obj")["class"];
      return this.removeClass("open");
    };
    $.fn.useItem = function() {
      dialog(["What do you want to", "use this on?"]);
      this.addClass("active");
      var obj = this.data("obj");
      defaultInventoryAction(obj.interacts_with);
    };
  })(jQuery);

  $(document).keyup(function(e) {
    var switcher = function(type) {
      if (!type) { return; }
      if (type === "clear") {
        type = "default";
        $inventory.find(".active").removeClass("active");
      }
      action = (action === type) ? "default" : type;
      $interface.find("a").removeClass("active").filter("#" + action).addClass("active");
    };
    var actions = {
      67: "close",
      69: "leave",
      72: "hit",
      76: "look",
      77: "move",
      79: "open",
      83: "speak",
      84: "take",
      85: "use",
      88: "clear"
    }
    switcher(actions[e.keyCode]);
  });

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

  function dialog(txt, cb) {
    if (debug.no_dialogs) {
      if (typeof cb === "function") { cb(); }
      return;
    }
    if (typeof txt === "object") {
      if (txt.length > 4) {
        var new_txt = txt.slice(4);
        txt = txt.slice(0, 4);
      }
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
          if (new_txt) { dialog(new_txt, cb); }
          else if (typeof cb === "function") { cb(); }
        });
      }
      else {
        $dialog.html("").hide();
        $dialog_layer.hide().unbind(e);
        if (new_txt) { dialog(new_txt, cb); }
        else if (typeof cb === "function") { cb(); }
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

  function death() {
    $stage.removeClass().empty().addClass("death");
    dialog(["It's a sad thing that", "your adventures have", "ended here!"], gameContinue);
  }

  function gameContinue() {
    var game_elements = [
      $interface.detach(),
      $dialog_layer.detach(),
      $dialog.detach(),
      $inventory.detach(),
      $("#view-frame").detach()
    ];
    $game.removeClass().addClass("continue");
    $("<a />", {
      "class": "continue",
      href: "#",
      click: function() {
        $game.empty().removeClass();
        for (var i in game_elements) {
          game_elements[i].appendTo($game);
        }
        return false;
      }
    }).appendTo($game);
    /*$("<a />", {
      "class": "end",
      href: "#"
    }).appendTo($game);*/
  }

  function updateInventory(item, adding) {
    var addItem = function() {
      var $item = $("<li />").attr({
        title: item.id
      }).bind("click", function() {
        $(this).trigger(action);
      }).data("obj", item).appendTo($inventory.find(".page.goods:last > ul"));
      for (var v in item) {
        if (typeof item[v] === "function") {
          $item.bind(v, item[v]);
        }
      }
      convertText(item.id, $item);
      $("<span />", {"class": "status"}).prependTo($item);
      $item.find("span").show();
    };
    if (adding) {
      if (inventory.length % 7 == 0) { $inventory.append(newInventoryPage()); }
      addItem();
      if (item.id === "torch" && item.count) {
        var $p = $inventory.find("li[title=torch] p");
        $("<span />", {"class": "equal"}).appendTo($p).show();
        $("<span />", {"class": digits_and_punct[item.count] }).appendTo($p).show();
      }
    }
    else {
      $inventory.find("ul li[title=" + item.id + "]").remove();
    }
  }

  function newInventoryPage(heading) {
    var $ul = $("<ul />", {"class": "letters"});
    if (heading) {
      var $title = $("<h1 />").append($ul.clone());
      convertText(heading, $("<li />").appendTo($title.find("ul")));
    }
    return $("<div />", {"class": "page " + (heading || "goods")}).appendTo($inventory).append($title).append($ul);
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