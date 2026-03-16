// on click on any "expandable" element, toggle the class "expanded" or "collapsed"

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("expanded");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
      content.style.border = null;
      content.style.padding = null;
    } else {
      content.style.maxHeight = "fit-content";
      content.style.border = "var(--widget-border)"
      content.style.padding = "0.5em";
    } 
  });
}