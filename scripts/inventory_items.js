var inventory_item = {
  "key 1": {
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
  }
};