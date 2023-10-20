const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");
const themeToggler = document.querySelector(".theme-toggler");

// Holds the background color of all chart
var chartBGColor = getComputedStyle(document.body).getPropertyValue(
    "--chart-background"
);
var chartFontColor = getComputedStyle(document.body).getPropertyValue(
    "--chart-font-color"
);
var chartAxisColor = getComputedStyle(document.body).getPropertyValue(
    "--chart-axis-color"
);

/*
  Event listeners for any HTML click
*/
menuBtn.addEventListener("click", () => {
    sideMenu.style.display = "block";
});

closeBtn.addEventListener("click", () => {
    sideMenu.style.display = "none";
});

themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-variables");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");

    // Update Chart background
    chartBGColor = getComputedStyle(document.body).getPropertyValue(
        "--chart-background"
    );
    chartFontColor = getComputedStyle(document.body).getPropertyValue(
        "--chart-font-color"
    );
    chartAxisColor = getComputedStyle(document.body).getPropertyValue(
        "--chart-axis-color"
    );
    updateChartsBackground();
});