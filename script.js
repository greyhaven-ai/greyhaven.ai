const animationContainer = d3.select(".animation-container");

let width = animationContainer.node().offsetWidth;
let height = (width *  0.75) / 4;

const svg = animationContainer.append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

const cloudSvg = animationContainer.append("svg")
  .attr("class", "cloud-container")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

const starCount = 500;
let stars = Array.from({ length: starCount }, () => ({
  x: Math.random() * width * 3 - width,
  y: Math.random() * height * 0.6,
  length: Math.random() * 5 + 1
}));

const starGroup = svg.append("g")
  .attr("class", "star-group");

starGroup.selectAll(".star")
  .data(stars)
  .enter()
  .append("circle")
  .attr("class", "star")
  .attr("cx", d => d.x)
  .attr("cy", d => d.y)
  .attr("r", 1);

// Cloud animation
const cloudCount = 10;
const cloudColors = ["cloud-color-1", "cloud-color-2", "cloud-color-3"];
const minCloudSize = 100; // Adjust this value as needed

let clouds = Array.from({ length: cloudCount }, () => ({
  x: Math.random() * width * 4 - width,
  y: Math.random() * height * 0.15,
  size: Math.max(Math.random() * height * 1.25, minCloudSize),
  type: Math.floor(Math.random() * 3) + 1,
  color: Math.floor(Math.random() * cloudColors.length)
}));

const cloudGroup = cloudSvg.append("g")
  .attr("class", "cloud-group");

const loadCloudSVGs = Promise.all([
  d3.xml("cloud1.svg"),
  d3.xml("cloud2.svg"),
  d3.xml("cloud3.svg")
]);

Promise.all([loadCloudSVGs, d3.xml("grey-haven-ship.svg")])
  .then(([[cloud1Data, cloud2Data, cloud3Data], shipData]) => {
    const cloudSvgs = [
      d3.select(cloud1Data.documentElement),
      d3.select(cloud2Data.documentElement),
      d3.select(cloud3Data.documentElement)
    ];

    const shipSvg = d3.select(shipData.documentElement);

    const shipGroup = svg.append("g")
      .attr("class", "ship-group")
      .node().appendChild(shipSvg.node());

    cloudGroup.selectAll(".cloud")
      .data(clouds)
      .enter()
      .append("g")
      .attr("class", d => `cloud ${cloudColors[d.color]}`)
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .each(function(d) {
        const cloudSvg = cloudSvgs[d.type - 1].node().cloneNode(true);
        d3.select(this).node().appendChild(cloudSvg);
        d3.select(this).select("path")
          .attr("transform", `scale(${d.size / 800})`);
      });

    updateShipSize();
    positionShip();
  });

  function updateShipSize() {
    const shipSvg = d3.select(".ship-group svg");
    const shipWidth = width * 0.45; 
    const shipHeight = height * 0.45; 
    shipSvg.attr("width", shipWidth).attr("height", shipHeight);
  }
  
  function positionShip() {
    const shipSvg = d3.select(".ship-group svg");
    const shipWidth = shipSvg.attr("width");
    const shipHeight = shipSvg.attr("height");
    const x = (width - shipWidth) / 2;
    const y = height - shipHeight;
    d3.select(".ship-group").attr("transform", `translate(${x}, ${y})`);
  }

function animateStars() {
  starGroup.selectAll(".star")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  starGroup.transition()
    .duration(60000)
    .ease(d3.easeLinear)
    .tween("transform", () => {
      const interpolate = d3.interpolateNumber(0, -width);
      return t => starGroup.attr("transform", `translate(${interpolate(t)}, 0)`);
    })
    .on("end", () => {
      stars.forEach(star => {
        star.x += width;
        if (star.x > width * 2) {
          star.x -= width * 2;
        }
      });
      generateNewStars();
      animateStars();
    });
}

function generateNewStars() {
  const newStars = Array.from({ length: starCount - stars.length }, () => ({
    x: width + Math.random() * width,
    y: Math.random() * height * 0.6
  }));

  stars = stars.filter(star => star.x > -width).concat(newStars);

  const starElements = starGroup.selectAll(".star")
    .data(stars, d => d.id);

  starElements.exit().remove();

  starElements.enter()
    .append("circle")
    .attr("class", "star")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 1);
}

function animateClouds() {
  cloudGroup.selectAll(".cloud")
    .attr("transform", function(d) {
      d.x -= 1; // Move clouds to the left
      // Adjusted condition to ensure cloud is fully out of view before resetting
      if (d.x < (-d.size * 2.5 + -width)) { 
        d.x = window.innerWidth + width + d.size; // Reset position to just outside the right edge
      }
      return `translate(${d.x}, ${d.y})`;
    });

  requestAnimationFrame(animateClouds);
}

function generateNewClouds() {
  const minHorizontalDistance = 200;
  const maxAttempts = 100;
  const topMargin = 20;
  const cloudHeight = height * 0.2;

  const newClouds = [];
  while (newClouds.length < cloudCount - clouds.length) {
    let attempts = 0;
    let newCloud;
    let isTooClose;

    do {
      const size = Math.max(Math.random() * 50 + 50, minCloudSize); // Ensure minimum size
      const x = width + size; // Generate clouds outside the right edge
      const y = topMargin + Math.random() * (cloudHeight - topMargin - size);

      newCloud = {
        x,
        y,
        size,
        type: Math.floor(Math.random() * 3) + 1,
        color: Math.floor(Math.random() * cloudColors.length)
      };

      isTooClose = clouds.concat(newClouds).some(cloud => {
        const distance = Math.abs(cloud.x - newCloud.x);
        return distance < minHorizontalDistance;
      });

      attempts++;
    } while (isTooClose && attempts < maxAttempts);

    if (isTooClose) {
      newCloud.x += minHorizontalDistance; // Move the cloud to the right
    }
    newClouds.push(newCloud);
  }

  clouds = clouds.filter(cloud => cloud.x > -cloud.size).concat(newClouds);

  const cloudElements = cloudGroup.selectAll(".cloud")
    .data(clouds, d => d.id);

  cloudElements.exit().remove();

  const newCloudElements = cloudElements.enter()
    .append("g")
    .attr("class", d => `cloud ${cloudColors[d.color]}`)
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  newCloudElements.each(function(d) {
    const cloudSvg = cloudSvgs[d.type - 1].node().cloneNode(true);
    d3.select(this).node().appendChild(cloudSvg);
    d3.select(this).select("path")
      .attr("transform", `scale(${d.size / 800})`);
  });
}

function resizeAnimation() {
  // Update container dimensions
  width = animationContainer.node().offsetWidth;
  height = width / 4;

  // Update SVG viewbox to new dimensions
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  cloudSvg.attr("viewBox", `0 0 ${width} ${height}`);

  // Recalculate and update cloud positions and sizes
  clouds.forEach(cloud => {
    cloud.x = cloud.x * (width / (cloud.prevWidth || width));
    cloud.y = cloud.y * (height / (cloud.prevHeight || height));
    cloud.size = Math.max(cloud.size * (width / (cloud.prevWidth || width)), minCloudSize); // Ensure minimum size
    cloud.prevWidth = width;
    cloud.prevHeight = height;
  });

  cloudGroup.selectAll(".cloud")
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
    .selectAll("path")
    .attr("transform", d => `scale(${d.size / 800})`);

  // Recalculate and update star positions
  stars.forEach(star => {
    star.x = star.x * (width / (star.prevWidth || width));
    star.y = star.y * (height / (star.prevHeight || height));
    star.prevWidth = width;
    star.prevHeight = height;
  });

  starGroup.selectAll(".star")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  // Update ship size and position
  updateShipSize();
  positionShip();
}

window.addEventListener("resize", resizeAnimation);

animateStars();
animateClouds(); 