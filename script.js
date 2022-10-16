const projectName = "Cloropleth-map";

/*Here we're going to get the dataset to use on our map */
//Here is our data URL

const COUNTY_URL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

const EDUCATION_URL =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

  const COLORS = {
    "red": "#ff0000",
	"orange": "#ffa700", 	
	"yellow": "#fff400", 	
	"lGreen": "#a3ff00", 	
	"dGreen": "#2cba00" 	
  }

//setting the size of the map

let w = 1000;
let h = 640;
let p = 20;

/*
+--------------------------------------------------------------+
|                       FUNCTIONS                              |
+--------------------------------------------------------------+

*/
// This will fetch the data as soon as the the document load;

async function getData(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

//giving an array of objets with fips information, it will return the object of the array with that information;

function findObj(arr, id) {
    return arr.find(o => o.fips == id);
}

// functions to find mean value and standard deviations of array of values
function meanValue(arr) {
    let n = arr.length;
    let mean = arr.reduce((a,b)=>a+b)/n;
    return mean;
}

function standardDev(arr) {
    let n = arr.length;
    let mean = arr.reduce((a,b)=>a+b)/n;
    let sd = Math.sqrt(arr.map(x=> Math.pow(x-mean,2)).reduce((a,b)=>a+b)/n);
    return sd;
}

//Function that generates an array with the range of the colors in our map;
async function legendRange(step,lowV){
    let rangeArray = [];
    let e = 0;
    let objSize = Object.keys(COLORS).length;
    for(let i=0;i<objSize;i++){
      e = lowV + i*step;
      e = Math.round(e*1000)/1000
      rangeArray.push(e);
    }
    return rangeArray;
  };
//--------------------------------------------------------------------------------


//main function that handles the asynchronous data

async function main(){

    //here we fetch the the data and convert it to geoJSON, so we can use it with d3js
    
    let countyData = await getData(COUNTY_URL);
    countyData = topojson.feature(countyData,countyData.objects.counties).features;
    let eduData = await getData(EDUCATION_URL);

    //selecting the canvas
    
    let canvas = d3.select("#choropleth-map")
        .append("svg")
        .attr("width",w)
        .attr("height",h)
        .attr("id","canvas");
    let legend = d3.select("#choropleth-map")
        .append("svg")
        .attr("width", 500)
        .attr("height",150)
        .attr("id","legend");
    let tooltip = d3.select("#choropleth-map")
                    .append("div")
                    .attr("class", "tooltip-class")
                    .attr("id", "tooltip")
                    .style("opacity", 0)

    //finding the range on education-data
    //using stardad deviation provides a more smooth change of colors

    let maxEdu = Math.round(Math.max(...eduData.map(o => o.bachelorsOrHigher)));
    let minEdu = Math.round(Math.min(...eduData.map(o => o.bachelorsOrHigher)));
    let arrayOfEdu = eduData.map(o => o.bachelorsOrHigher);
    let mean = Math.round(meanValue(arrayOfEdu));
    let sd = Math.round(standardDev(arrayOfEdu));
    step = sd;


    //creating the legend scale 

    let legendScale = d3.scaleLinear()
                        .domain([minEdu/100,maxEdu/100])
                        .range([30,470]);
                        
    let rangeArray = await legendRange(step,minEdu);
    //creating the path elements

    canvas.selectAll("path")
    .data(countyData)
    .enter()
    .append("path")
    .attr("d",d3.geoPath())
    .attr("class","county")
    .attr("fill", (cData)=>{
        lvl = findObj(eduData,cData.id).bachelorsOrHigher;
        if(lvl < (minEdu+step)) return COLORS.red;
        if(lvl < (minEdu+2*step)) return COLORS.orange;
        if(lvl < (minEdu+3*step)) return COLORS.yellow;
        if(lvl < (minEdu+4*step)) return COLORS.lGreen;
        if(lvl <= (maxEdu)) return COLORS.dGreen;
    })
    .attr("data-fips",(cData)=>{
        return findObj(eduData,cData.id).fips;
        
    })
    .attr("data-education",(cData)=>{
        return findObj(eduData,cData.id).bachelorsOrHigher;
    })
    .on("mouseover", (event,cData)=>{
        let obj = findObj(eduData,cData.id);
        tooltip.attr("data-education",obj.bachelorsOrHigher)
        tooltip.style("left", event.pageX +15+ "px")
        .style("top", event.pageY+ "px")
        tooltip.transition()
        .duration(200)
        .style("opacity", 0.9)
        .style("background-color","black")
        .style("color", "white")
        tooltip.html("<p>" + obj.area_name + ", " + obj.state + "</br>"
        + "data-education: " + obj.bachelorsOrHigher + "%</p>"
        )
    })
    .on("mouseout", ()=>{
        tooltip.transition()
        .duration(200)
        .style("opacity",0)
    })

    //making the legend axis
    legend.selectAll("rect")
            .data(rangeArray)
            .enter()
            .append("rect")
            .attr("x", (d,i)=> 20+i*87.5)
            .attr("y",40)
            .attr("height", 35)
            .attr("width", 90)
            .attr("fill",function(d,i){
             return COLORS[Object.keys(COLORS)[i]];
      })
    const legAxis = d3.axisBottom(legendScale).tickFormat(d3.format(",.0%"));
    legend.append("g")
    .attr("id","legend-axis")
    .attr("transform", "translate(-11"+","+76+")")
    .call(legAxis.ticks(7));

}

main();