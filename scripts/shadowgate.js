$(function() {
  var $game = $("#game"),
      $interface = $("#interface"),
      $inventory = $("#inventory"),
      $stage = $("#stage"),
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
    "bg_interface.gif",
    "bg_inventory.jpg",
    "bg_view-frame.gif",
    "icon_pen.gif",
    "torch_large.gif",
    "title.gif"
  ];
  var remaining_images = images.length;
  var stages = {
    "1": {
      skull: {
        click: function(e) {
          var $e = $(this);
          $stage.removeClass().addClass("s1_alt");
          $e.unbind(e).animate({
            top: parseInt($e.css("top"), 10) - 32
          }, 1500);
        }
      },
      key1: {
        click: function() {
          inventory.push("key 1");
          $(this).remove();
        }
      },
      door: { click: function() { door($(this), "s2"); } }
    },
    "2": {
      torch1: { click: function() { torch($(this)); } },
      torch2: { click: function() { torch($(this)); } },
      door1: { click: function() { door($(this), "s3"); } },
      door2: { click: function() { door($(this), "s4"); } },
      rug: { click: function() { $(this).remove(); } }
    }
  };

  $interface.find("a").click(function() {
    $interface.find("a").not($(this)).removeClass("active");
    $(this).toggleClass("active");
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
    $stage.find("*").remove();
    for (var v in s) {
      $("<div />").attr({
        "class": v
      }).bind("click", s[v].click).appendTo($stage);
    }
  }

  function torch($e) {
    if ($.inArray("torch", inventory) < 0) {
      inventory.push("torch");
    }
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

  function random(max, min) {
    min = min || 0;
    return min + Math.floor(Math.random() * max);
  }
});