var width = window.innerWidth,
    height = window.innerHeight;

var news_content = d3.select("#news");

var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-250)
    .linkDistance(60)
    .size([width, height]);

var x = d3.scale.linear()
    .domain([0, 10])
    .range([250, 80])
    .clamp(true);

var brush = d3.svg.brush()
    .y(x)
    .extent([0, 0]);

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

var links_g = svg.append("g");

var nodes_g = svg.append("g");

var links_label_g = svg.append("g")

var nodes_label_g = svg.append("g")

var div = d3.select("#graph").append("div") 
    .attr("class", "tooltip")      
    .style("opacity", 0);


svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + (width - 20)  + ",0)")
    .call(d3.svg.axis()
      .scale(x)
      .orient("left")
      .tickFormat(function(d) { return d; })
      .tickSize(0)
      .tickPadding(12))
  .select(".domain")
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "halo");

var slider = svg.append("g")
    .attr("class", "slider")
    .call(brush);

slider.selectAll(".extent,.resize")
    .remove();

var handle = slider.append("circle")
    .attr("class", "handle")
    .attr("transform", "translate(" + (width - 20) + ",0)")
    .attr("r", 5);

svg.append("text")
    .attr("x", width - 15)
    .attr("y", 60)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .style("opacity", 0.5)
    .text("Threshold")

svg.append("text")
    .attr("id","sentbox")
    .attr("transform","translate(15,15)")
    .attr("width", 400)
    .attr("font-size", "10px")
    //.attr("dy", ".35em")
    .text("   ");

links_g.append("defs").selectAll("marker")
      .data(["end"])
    .enter().append("marker")
      .attr("id", "triangle")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("markerUnits", "strokeWidth")
      .attr("xoverflow", "visible")
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0, -5L10, 0L0, 5")
      .style("fill", "#ccc");

/*
d3.tsv("news.tsv", function(data){
  var cards = d3.select('#news_content')
              .selectAll('.card')
              .data(data);
  // ENTER new elements
  cards.enter()
      .append('div')
      .attr("class", "card") 
      .attr("transform", "translate(50,50)")
      .html(function (d) { 
        //console.log(d.headline.substring(5,20));
        return "<h2>" + d.headline + "</h2>" + "<p>"+d.content+"</p>"; }) 

});*/


d3.json("data.json", function(error, graph) {
  if (error) throw error;

  function brushed() {
    var value = brush.extent()[0];
  
    if (d3.event.sourceEvent) {
      value = x.invert(d3.mouse(this)[1]);
      brush.extent([value, value]);
    }
    handle.attr("cy", x(value));
    var threshold = value;

    //var threshold = 0;

    var thresholded_nodes = graph.nodes.filter(function(d){ return (d.size > threshold);});

    var n_id = []
    thresholded_nodes.forEach(function(d) {n_id.push(d.id)});

    //if (typeof graph.links[8].source === "number"){
    //  graph.links[9].source = 3;
    //  graph.links[9].target = 9;
    //}
    //else {
    //  graph.links[9].source = graph.nodes[3];
    //  graph.links[9].traget = graph.nodes[9];
    //}
    

    var thresholded_links = graph.links.filter(function(d){
      //console.log(d);
      if (typeof d.source !== "undefined"){
        return (n_id.includes(d.source) && n_id.includes(d.target))||(n_id.includes(d.source.id) && n_id.includes(d.target.id));
      }
    });

    //var thresholded_links = new Array();
    //graph.links.forEach(function(d){
    //  if (n_id.includes(d.source) && n_id.includes(d.target)){
    //    thresholded_links.push(d);
    //    thresholded_links[thresholded_links.length-1].source = n_id.indexOf(d.source);
    //    thresholded_links[thresholded_links.length-1].target = n_id.indexOf(d.target);
    //  }
    //  console.log(thresholded_links);
    //});

    //console.log(thresholded_links);

    force
        .links(thresholded_links);
     
    var link = links_g.selectAll(".link")
        .data(thresholded_links, function(d){ return d.id; });

    link.enter().append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#triangle)")
        .style("stroke-width", "2");

    var linkLabel = links_label_g.selectAll(".link")
                    .data(thresholded_links, function(d){ return d.id; });

    linkLabel.enter().append("text")
            .attr("dx", 12)
            .attr("dy", ".50em")
            .attr("class","link")
            .attr("stroke-width", ".5")
            .attr("font-size", "10px")
            //.text(function(d) { return d.text; });
            .text(" ");

    force
      .nodes(thresholded_nodes);

    var node = nodes_g.selectAll(".node")
        .data(thresholded_nodes, function(d){ return d.id; });

    node.enter().append("g")
        .attr("class", "node")
        .call(force.drag);

    node.append("circle")
        .attr("r", function(d){return d.size*2;})
        .style("fill", function(d) { return color(d.group); })
        .on("mouseover",function(d){ 
          div.transition()
              .duration(200)
              .style("opacity",.9);
          div.html("<h4>"+d.text+"</h4>"+d.sentence)
              .style("left", "50px")
              .style("top", "50px");})
        .on("mouseout",function(d){
          //div.transition()
          //    .duration(20)
          //    .style("opacity",0);

        });

    var nodeLabel = nodes_label_g.selectAll(".node")
        .data(thresholded_nodes, function(d){ return d.id; });

    nodeLabel.enter().append("text")
        .attr("class","node")
        .attr("dx", 12)
        .attr("dy", ".50em")
        //.text(function(d){ return d.text;
        .attr("font-size", "10px")
        .text(function(d) {
          if (d.size < (threshold+5)){
            return d.text;
          }
          else{
            return " ";
          }
        });

    nodeLabel.exit().remove();
    linkLabel.exit().remove();
    node.exit().remove();
    link.exit().remove();
    
    //console.log(graph.links)
    //console.log(graph.nodes)

    force.on("tick", function() {
      // console.log(nodeLabel)
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      linkLabel.attr("transform", function(d) { 
        return "translate(" + (d.source.x+d.target.x)/2 + "," + (d.source.y+d.target.y)/2 + ")";});
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";});
      nodeLabel.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";});
  
  
      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

    force.start();

  }


  brush.on("brush", brushed);

  slider
    .call(brush.extent([0, 0]))
    .call(brush.event);

});

function update_sent(s){
  console.log(s);
  d3.select("#sentence_box").html(s);
};

function clean_sent(){
  d3.select("#sentence_box").html("  ");
};