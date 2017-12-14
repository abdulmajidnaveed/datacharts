
mostRecentActiveb = document.getElementById("b0");

// switch classes inactive and active of buttons 
function f1(buttonId){
    var newButtonPressed = document.getElementById(buttonId);
    if (newButtonPressed.className === "inactive") {
        newButtonPressed.className = "active"; 
        mostRecentActiveb.className = "inactive";
        mostRecentActiveb=newButtonPressed;
    } else {
        // pressed already active button; do nothing
    }
    toggleResponsive();f2(buttonId);
}

// show one div and hide the rest
function f2(buttonId){
    var contentdivs = document.getElementsByClassName("content-div");
    for (i=0; i< contentdivs.length; i++){
        // contentdivs[i].style.backgroundColor = 'grey';
        contentdivs[i].style.display = 'none';
    }
    var contentDiv;
    if (buttonId==='b0'){
        contentDiv = document.getElementsByClassName('container')[0];
    } else if (buttonId==='b1'){
        contentDiv = document.getElementById('content-description');
    } else if (buttonId==='b2'){
        contentDiv = document.getElementById('content-data');
    } else if (buttonId==='b3'){
        contentDiv = document.getElementById('content-libraries');
    } else if (buttonId==='b4'){
        contentDiv = document.getElementById('content-about');
    }
    contentDiv.style.display = 'block';
}

/* Toggle between adding and removing the "responsive" class 
to topnav when the user clicks on the icon */
function toggleResponsive() {
    var x = document.getElementById("topnav");
    if (x.className === "topnavbar") {
        x.className += " responsive";
    } else {
        x.className = "topnavbar";
    }
}

// f1('b0'); // this clicks on button b0
// this throws an error because the div 
// <div class="container content-div">
// and the divs <div  ... class="content-div" >
// are not loaded yet
