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
    "bg_interface.gif",
    "bg_inventory.jpg",
    "bg_view-frame.gif",
    "icon_pen.gif",
    "text_goods.gif",
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
          return false;
        }
      },
      key1: {
        click: function() {
          inventory.push("key 1");
          $(this).remove();
          return false;
        }
      },
      door: {
        click: function() {
          var $e = $(this);
          if ($e.hasClass("open")) {
            // $stage.removeClass().addClass("s2");
            // stageSetup();
            console.log("stage 2");
          }
          else {
            $e.addClass("open");
          }
          return false;
        }
      }
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

  function random(max, min) {
    min = min || 0;
    return min + Math.floor(Math.random() * max);
  }
});