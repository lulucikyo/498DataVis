
    //overall data and setting
    var usmap = d3.json("https://unpkg.com/us-atlas@1/us/10m.json");
    var data = d3.csv("../data/time_series_covid19_confirmed_US.csv");

    var margin = {top:100, right:100, bottom:100, left:100},
        width = 1080,
        height = 800;
    var svg1 = d3.select("#scene1").attr("width", width).attr("height", height);
    var svg2 = d3.select("#scene2").attr("width", width).attr("height", height);
    var svg3 = d3.select("#scene3").attr("width", width).attr("height", height);

    //map projection
    var projection = d3.geoAlbersUsa()
        .translate([480, 300]).scale(1280)
    var path = d3.geoPath()

    // Append Div for tooltip to SVG
    var div = d3.select("body")
		    .append("div")   
            .attr("id","tool-tip")
    		.attr("class", "tooltip")               
    		.style("opacity", 0);
        p1 = div.append("div")
        p2 = div.append("div")

    //update function for year
    var startDate = new Date("01/22/2020")
    listDate = []
    for (i=0; i<185; i++){
        tmp = new Date(startDate.getTime() + i*864E5);
        listDate[i] = (tmp.getMonth()+1).toString() + "/" + tmp.getDate().toString() + "/20"
    }
    console.log(listDate)

Promise.all([usmap, data]).then(function (values) {
//read data and topojson file    
    var map = values[0];
    var covid = values[1];
    var stateFeatures = topojson.feature(map, map.objects.states).features;
    var countyFeatures = topojson.feature(map, map.objects.counties).features;

    console.log(map)
    console.log(countyFeatures)
    console.log(covid)

//settings for page 1************************************
    //slide bar location
    var slider = d3.select("#slider")
    //slide bar setting
    slider.append("input")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", 184) //col range
        .attr("step","1")
        .attr("id", "date")
        .attr("value", 184) //default value
        .on("input", function input() {
            update();
            update3();
        }
        ); 

    //draw svg1
    svg1.append("g")
        .selectAll("path")
        .data(countyFeatures)
        .enter()
        .append("path")
        .attr("fill", "#ccc")
        .attr("stroke", "white")
        .attr("d",path)
        .on("mouseover", function(d,i) {
            var currentState = this;
            d3.select(this).style("fill-opacity", 0.5);
        })
        .on("mouseout", function(d,i) {
            var currentState = this;
            d3.select(this).style("fill-opacity", 1)
        })
    svg1.append("g") 
        .selectAll("path")
        .data(stateFeatures)
        .enter()
        .append("path")
        .attr("stroke", "grey")
        .attr("fill", "none")
        .attr("d",path)
    update();

    function update() {
        svg1.select("#circle-group").remove()
        
        var slider_col = document.getElementById("date").value;
        var curDate = listDate[slider_col]

        d3.select("#slider-date").text("Date: "+curDate)
        
        var circles = svg1.append("g")
            .attr("id","circle-group")
            .selectAll("circle")
        var join = circles.data(covid)
        var enter = join.enter()
        var exit = join.exit()

        enter.append("circle")
            .filter(function(d) {
                return (projection([d.Long_, d.Lat])!==null && d[curDate]!=0)
                })
            .attr("cx", function(d) {return projection([d.Long_, d.Lat])[0];})
            .attr("cy", function(d) {return projection([d.Long_, d.Lat])[1];})
            .attr("r", function(d) {return d[curDate]/10000})
            .style("fill", "#5A7FE1")
            .attr("stroke", "#5A7FE1")
            .attr("stroke-width", 3)
            .attr("fill-opacity", .4)
            .on("mouseover", function(d,i){
                //tooltip
                var currentState = this;
                d3.select(this).style("fill-opacity", 0.8);
                div.transition()        
      	            .duration(200)      
                    .style("opacity", .9);      
                p1.text(d["Admin2"]+", "+d["Province_State"])
                p2.text("Total Confirmed Case: "+d[curDate])
                div.style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");
                //console.log(div)
            })
            .on("mouseout", function(d,i){
                var currentState = this;
                d3.select(this).style("fill-opacity", 0.4)
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

        exit.remove();
    }   

    function drawPage1() {
        //switch scene
        d3.select("#page1").style("display","block")
        d3.select("#page2").style("display","none")
        d3.select("#page3").style("display","none")
        d3.select("#scene1").style("display","block")
        d3.select("#scene2").style("display","none")
        d3.select("#scene3").style("display","none")
        d3.select("#head1").style("display","block")
        d3.select("#head2").style("display","none")
        d3.select("#head3").style("display","none")
    }


//************ Draw Page 2***************
    //data processing for page2
    for (i=0; i<185; i++){
        var value = listDate[i]
        
        temp = d3.nest()
        .key(function (d) {return d.Province_State;})
        .rollup(function(v) {
            return {
                cases: d3.sum(v, function(d) {return d[value]}),
                date: listDate[i],
                //name: d.Province_State
            }       
        })
        .entries(covid)
        
        temp2 = temp.map(function (d,i) {
            return{
                state: d.key,
                value: [{date: d.value.date, cases: d.value.cases}]
            }
        })

        if (i==0) {
            var tmp2 = temp2
        } else {
            for (j=0; j<tmp2.length; j++){
                tmp2[j].value.push(temp2[j].value[0])
            }
        }
    }

    console.log(tmp2)

    stateName = []
    for (i=0; i<58; i++) {
        stateName.push(tmp2[i].state)
    }
    console.log(stateName)

    var myColor = d3.scalePoint().domain(stateName).range([0,1]);

    var xPage2 = d3.scalePoint().domain(listDate).range([0, width-margin.left-margin.right])
    var yPage2 = d3.scaleLinear().domain([0,500000]).range([height-margin.bottom-margin.top, 0])

    var line = d3.line()
        .x(function(d) {return xPage2(d.date)})
        .y(function(d) {return yPage2(d.cases)})


    function drawPage2() {
        d3.select("#page1").style("display","none")
        d3.select("#page2").style("display","block")
        d3.select("#page3").style("display","none")
        d3.select("#scene1").style("display","none")
        d3.select("#scene2").style("display","block")
        d3.select("#scene3").style("display","none")
        d3.select("#head1").style("display","none")
        d3.select("#head2").style("display","block")
        d3.select("#head3").style("display","none")
    }

    //main part of line chart
    svg2.append("g")
        .attr("transform", "translate("+margin.left+","+margin.top+")")
        .selectAll("path")
        .data(tmp2)//.slice(14,19))
        .enter()
        .append("path")
        .attr("class", function(d,i) {return "state"+i+"-line"})
        .attr("d", function(d) {
            //console.log(line(d.value))
            return line(d.value)
            })
        .attr("stroke", function(d) {return d3.interpolateRainbow(myColor(d.state))})
        .style("fill", "none")
        .style("stroke-width", 4)
        .style("opacity", 0)
    //labels
    svg2.append("g")
        .attr("transform", "translate("+margin.left+","+margin.top+")")
        .selectAll("Labels")
        .data(tmp2)
        .enter()
        .append("g")
        .append("text")
        .attr("class", function(d,i) {return "state"+i+"-label"})
        .datum(function(d) { 
            console.log(d.state)
            console.log(d.value[d.value.length - 1])
            return {state: d.state, value: d.value[d.value.length - 1]}; })
        .attr("transform", function(d) { 
            console.log(xPage2(d.value.date))
            console.log(yPage2(d.value.cases))
            return "translate(" + xPage2(d.value.date) + "," + yPage2(d.value.cases) + ")"; })
        .attr("x", 10) // shift the text a bit more right
        .text(function(d) { return d.state; })
        .style("fill", function(d) {return d3.interpolateRainbow(myColor(d.state))})
        .style("font-size", 15)
        .style("opacity", 0)


    //add x axis
    svg2.append("g")
        .attr("transform", "translate("+margin.left+","+(height - margin.bottom)+")")
        .call(d3.axisBottom(xPage2)
                .tickValues(["2/1/20","3/1/20","4/1/20","5/1/20","6/1/20","7/1/20"]))
    //add y axis
    svg2.append("g")
        .attr("transform", "translate("+margin.left+","+(margin.top)+")")
        .call(d3.axisLeft(yPage2))


    function drawCircle2(item, index) {
        //circle and tool tip for mouseover
        var half = item.value.filter(function (d) {return d.cases<item.value[184].cases/2})
        var halfitem = half[half.length-1]
        console.log(half)
        console.log(halfitem)
        
        svg2.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .selectAll("circle")
            .data([halfitem])
            .enter()
            .append("circle")
            .attr("class", "state"+index+"-circle")
            .attr("cx", function (d) {return xPage2(d.date)})
            .attr("cy", function (d) {return yPage2(d.cases)})
            .attr("r", 5)
        svg2.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .selectAll("Annotation")
            .data([halfitem])
            .enter()
            .append("text")
            .attr("class", "state"+index+"-circle")
            .attr("x", function (d) {return (xPage2(d.date)-150)})
            .attr("y", function (d) {return (yPage2(d.cases))})
            .text(function (d) {return ("Half cases after "+d.date)})

        var name = item.state
        svg2.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .selectAll("circle")
            .data(item.value)
            .enter()
            .append("circle")
            .attr("class", "state"+index+"-circle")
            .attr("cx", function (d) {return xPage2(d.date)})
            .attr("cy", function (d) {return yPage2(d.cases)})
            .attr("r", 2)
            .attr("fill", function(d) {return d3.interpolateRainbow(myColor(name))})
            .on("mouseover", function(d){
                //tooltip
                var cur = this;
                d3.select(this).attr("r",5)
                div.transition()        
      	            .duration(200)      
                    .style("opacity", .9);    
                p1.text("Confirmed Case: "+d.cases)
                div.style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");
            //console.log(div)
            })
            .on("mouseout", function(d,i){
                var cur = this;
                d3.select(this).attr("r",2)
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

        
    }

    var button = d3.select("#page2")
        .append("div")
        .attr("class", "btn-toolbar")
        .attr("role","toolbar")
    button.append("div")
        .attr("class", "btn-group btn-group-sm")
        .selectAll("button").data(Array(15)).enter().append("button")
    button.append("div")
        .attr("class", "btn-group btn-group-sm")
        .selectAll("button").data(Array(19)).enter().append("button")
    button.append("div")
        .attr("class", "btn-group btn-group-sm")
        .selectAll("button").data(Array(15)).enter().append("button")
    button.append("div")
        .attr("class", "btn-group btn-group-sm")
        .selectAll("button").data(Array(9)).enter().append("button")

    button.selectAll("button")
        .data(tmp2)
        .attr("type", "button")
        .attr("class", "btn btn-secondary")
        .attr("id", function(d){return d.state})
        .text(function(d) {return d.state})
        .on("click", function(d, i) {
            var curOpacity = d3.selectAll(".state"+i+"-line").style("opacity")
            //d3.selectAll("."+d.state+"-circle").transition().style("opacity", curOpacity == 1 ? 0:1)
            d3.selectAll(".state"+i+"-line").transition().style("opacity", curOpacity == 1 ? 0:1)
            d3.selectAll(".state"+i+"-label").transition().style("opacity", curOpacity == 1 ? 0:1)
            if (curOpacity==0){
                d3.select(this).attr("class", "btn btn-secondary active")
                drawCircle2(tmp2[i], i)
            } else {
                d3.select(this).attr("class", "btn btn-secondary")
                d3.selectAll(".state"+i+"-circle").remove()
            }
        })

    $("#California").click();
    $("#Florida").click();
    $("#Texas").click();    
//**************Page 3************************

    var yPage3 = d3.scaleBand().domain([0,1,2,3,4,5,6,7,8,9]).range([0, height-margin.top-margin.bottom]).padding(.1);

    function update3() {
        svg3.selectAll("*").remove()

        svg3.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .selectAll("Titles")
            .data([0])
            .enter()
            .append("text")
            .attr("transform", "translate(10,-50)")
            .attr("font-size", 20)
            .text("Top 10 States with COVID-19 Cases")

        svg3.append("g")
            .attr("transform", "translate("+(margin.left/2+width/2)+","+margin.top+")")
            .selectAll("Titles")
            .data([0])
            .enter()
            .append("text")
            .attr("transform", "translate(10,-50)")
            .attr("font-size", 20)
            .text("Top 10 Counties with COVID-19 Cases")

        var slider_col = document.getElementById("date").value;
        var curDate = listDate[slider_col]
        var data3 = tmp2.map(function (d, i) {
            var tt = d.value
            return{
                state: d.state,
                cases: tt[slider_col].cases
            }
        })
        var data4 = covid.map(function (d,i) {
            return{
                state: d.Province_State,
                county: d.Admin2,
                cases: d[curDate]
            }
        })
        data3 = data3.sort(function(a,b) {
            return -a.cases - -b.cases
        })
        data4 = data4.sort(function(a,b) {
            return -a.cases - -b.cases
        })
        
        console.log(data3)
        console.log(data4)

        var topState = data3[0].cases
        var topCounty = data4[0].cases

        console.log(topState)
        console.log(topCounty)

        var xState = d3.scaleLinear().domain([0, topState]).range([0, width/2-margin.left*1.5])
        var xCounty = d3.scaleLinear().domain([0, topCounty]).range([0, width/2-margin.left*1.5])

        //bar chart by state
        svg3.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .attr("id", "rect-group1")
            .selectAll("rect")
            .data(data3.slice(0,10))
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d,i) {return yPage3(i)})
            .attr("width", function(d) {return xState(d.cases)})
            .attr("height", yPage3.bandwidth())
            .attr("fill", "#69b3a2")
            .on("mouseover", function(d){
                //tooltip
                var cur = this;
                d3.select(this).style("fill-opacity", 0.5)
                div.transition()        
      	            .duration(200)      
                    .style("opacity", .9);    
                p1.text("Confirmed Case on "+curDate+": "+d.cases)
                div.style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d,i){
                var cur = this;
                d3.select(this).style("fill-opacity", 1)
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
        //bar chart by county
        svg3.append("g")
            .attr("transform", "translate("+(margin.left/2+width/2)+","+margin.top+")")
            .attr("id", "rect-group1")
            .selectAll("rect")
            .data(data4.slice(0,10))
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d,i) {return yPage3(i)})
            .attr("width", function(d) {return xCounty(d.cases)})
            .attr("height", yPage3.bandwidth())
            .attr("fill", "#5A7FE1")
            .on("mouseover", function(d){
                //tooltip
                var cur = this;
                d3.select(this).style("fill-opacity", 0.5)
                div.transition()        
      	            .duration(200)      
                    .style("opacity", .9);    
                p1.text("Confirmed Case on "+curDate+": "+d.cases)
                div.style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d,i){
                var cur = this;
                d3.select(this).style("fill-opacity", 1)
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
        //axis for state
        svg3.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .call(d3.axisTop(xState))
        svg3.append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")")
            .call(d3.axisLeft(yPage3).tickFormat(function(d,i){
                return data3[i].state
            }))
        //axis for county
        svg3.append("g")
            .attr("transform", "translate("+(margin.left/2+width/2)+","+margin.top+")")
            .call(d3.axisTop(xCounty))
        svg3.append("g")
            .attr("transform", "translate("+(margin.left/2+width/2)+","+margin.top+")")
            .call(d3.axisLeft(yPage3).tickFormat(function(d,i){
                return (data4[i].county+", "+data4[i].state)
            }))

    }
    
    update3();


    function drawPage3() {
        //switch scene
        d3.select("#page1").style("display","block")
        d3.select("#page2").style("display","none")
        d3.select("#page3").style("display","block")
        d3.select("#scene1").style("display","none")
        d3.select("#scene2").style("display","none")
        d3.select("#scene3").style("display","block")
        d3.select("#head1").style("display","none")
        d3.select("#head2").style("display","none")
        d3.select("#head3").style("display","block")
    }


//****************************************
    //initialize
    drawPage2();
    
    //scene change
    var counter = 2

    $("#backward").click(function (){
		counter = counter - 1;
		if(counter < 1){
			counter = 3;
		}
        //hide or show elements for different pages
        switch(counter) {
            case 1: 
                drawPage1();
                break;
            case 2: 
                drawPage2();
                break;
            case 3:
                drawPage3();
        }
        console.log(counter)
	});

	$("#forward").click(function (){
		counter = counter + 1;
		if(counter > 3){
			counter = 1;
		}
        //hide or show elements for different pages
        switch(counter) {
            case 1: 
                drawPage1();
                break;
            case 2: 
                drawPage2();
                break;
            case 3:
                drawPage3();
        }
		//update svg below
        console.log(counter)
	});


});