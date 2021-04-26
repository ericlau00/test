const delay = time => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

const draw_head = async () => {
    let head = document.getElementById('head-graphic');
    let domain_set = await d3.json('./domain_set.json');

    for (const domain of domain_set) {
        for (const letter of domain) {
            await delay(100);
            head.textContent += letter;
        }
    }
}

window.onload = async () => {    
    let domain_top = await d3.json('./domain_top.json');
    console.log(domain_top.length);

    let comma = d3.format(',');

    let bubble = 
        d3.select('#bubble');

    const width = bubble.select(function() { return this.parentNode }).node().clientWidth;
    const height = width;

    bubble
        .attr('viewBox', [0, 0, width, height])
        .attr('font-family', 'sans-serif');

    let hierarchy = 
        d3.hierarchy({children: domain_top}).sum(d => d.visits);

    let pack = 
        d3.pack()
            .size([width, height])
            .padding(3)
            (hierarchy);

    const fill_circle = d => ("color" in d.data) ? d.data.color : "gray";

    let leaf = 
        bubble.selectAll('g')
            .data(pack.leaves())
            .join('g')
                .attr('transform', d => `translate(${d.x + 1}, ${d.y + 1})`)
    
    let circle = 
        leaf.append('circle')
            .attr('r', d => d.r)
            .attr('stroke', 'black')
            .attr('stroke-width', 0)
            .attr('fill', fill_circle)

    let tooltip = 
        d3.select('main')
            .append('div')
                .attr('class', 'd3-tip')
                .style('position', 'absolute')
                .style('display', 'none')

    circle
        .on('mouseenter', function(e, d) {
            let domain = d.data.domain;
            let label = ("label" in d.data) 
                ? d.data.label 
                : domain.charAt(0).toUpperCase() + domain.slice(1)

            let alt = (domain !== label) ? `(${domain})` : String();

            tooltip
                .style('display', 'block')
                .html(`
                    <b>${label}</b> ${alt}<br>
                    ${comma(d.data.visits)} visits`)
            d3.select(this)
                .attr('stroke-width', 1)
        })
        .on('mousemove', function(e) {
            let x = e.pageX + 5;
            let shift = (x > window.innerWidth * 0.5) ? x - 170 : x;
            tooltip
                .style('visibility', 'visible')
                .style('top', `${e.pageY - 40}px`)
                .style('left', `${shift}px`)
        })
        .on('mouseleave', function() {
            tooltip
                .style('display', 'none');
            d3.select(this)
                .attr('stroke-width', 0)
        })

    const trans = () => d3
            .transition()
            .duration(500)
            .ease(d3.easeLinear);

    const is_genius = d => ("color" in d.data) ? d.data.color === "#FFFF64" : false;
    let not_genius = circle.filter(d => !is_genius(d))
    let genius = circle.filter(is_genius);

    let swarm_data = await d3.json('genius.json');
    swarm_data.reverse();
    let time = d3.timeParse('%Y-%m-%d %H:%M:%S');
    let tformat = d3.timeFormat("%I %p")

    const margin = {left: 25, bottom: 20, right: 25, top: 20};

    let x = d3.scaleTime()
        .domain(d3.extent(swarm_data, d => time(d.time))).nice()
        .range([margin.left, width - margin.right]);

    let axis = bubble.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(tformat))
        .attr('visibility', 'hidden');

    let geniuses = bubble.selectAll('.genius')
        .data(swarm_data)
            .join('circle')
                .attr('class', 'genius')
                .attr('cx', d => x(time(d.time)))
                .attr('cy', height / 2)
                .attr('r', 0)
                .attr('stroke-width', 1)
                .attr('fill', 'transparent');

    function set_mouse(selection) {
        selection
            .on('mouseenter', function(e, d) {
                if ("title" in d) {
                    tooltip
                    .style('display', 'block')
                    .html(`
                        <b>${d.title}</b><br>
                        ${d.time.toString()}`)
                }
                d3.select(this)
                    .attr('stroke-width', 2)
            })
            .on('mousemove', function(e) {
                let x = e.pageX + 5;
                let shift = (x > window.innerWidth * 0.5) ? x - 170 : x;
                tooltip
                    .style('visibility', 'visible')
                    .style('top', `${e.pageY - 40}px`)
                    .style('left', `${shift}px`)
            })
            .on('mouseleave', function() {
                tooltip
                    .style('display', 'none');
                d3.select(this)
                    .attr('stroke-width', 1)
            })
    }

    set_mouse(geniuses);

    let tick = () => {
        geniuses
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
    }

    let sim = d3.forceSimulation(swarm_data)
        .force('x', d3.forceX(d => x(time(d.time))).strength(0.75))
        .force('y', d3.forceY(height / 2).strength(0.05))
        .force('collide', d3.forceCollide(5))
        .on('tick', tick)

    let extra = await d3.json('./extra.json');
    let combine = swarm_data.concat(extra);

    let scoller = scrollama();
    scoller
        .setup({
            step: ".step",
            offset: 0.75,
            // debug: true
        })
        .onStepEnter(async res =>  {
            if (res.index === 0 && res.direction === "down") {
                not_genius
                    .transition(trans())
                    .attr('fill', 'transparent')
                    .attr('pointer-events', 'none');

                let t = genius.select(function() {
                    return this.parentNode
                }).attr('transform');

                genius
                    .transition(trans())
                    .attr('stroke-width', 1)
                    .attr('pointer-events', 'none')
                    .attr('cx', (width / 2) - Number(t.substring(10, t.indexOf(','))))
            }
            if (res.index === 1 && res.direction === "down") {
                genius 
                    .transition(trans())
                    .attr('fill', 'transparent')
                    .attr('stroke-width', 0);

                geniuses
                    .transition(trans())
                    .attr('r', 7)
                    .attr('stroke', 'black')
                    .attr('fill', "#FFFF64")

                axis.attr('visibility', 'visible');
            }
            if (res.index === 2 && res.direction === "down") {
                geniuses
                    .transition(trans())
                    .attr('fill', d => d.new ? "#FFFF64": "gray");
            }
            if (res.index === 3 && res.direction === "down") {
                sim.restart();

                geniuses = geniuses.data(combine)
                    .join(
                        enter => enter
                            .append('circle')
                            .call(enter => enter.transition(trans()).attr('r', 7))
                            .attr('class', 'genius')
                            .attr('fill', d => ("color" in d) ? d.color : 'lightgray')
                            .attr('stroke', 'black'),
                        update => update,
                        exit => exit.remove()
                    );

                sim.nodes(combine)
                sim.alpha(1).restart();

                set_mouse(geniuses);
            }
        })
        .onStepExit(res => {
            if (res.index === 0 && res.direction === "up") {
                not_genius
                    .transition(trans())
                    .attr('fill', fill_circle)
                    .attr('pointer-events', 'visiblePainted');

                genius
                    .transition(trans())
                    .attr('fill', "#FFFF64")
                    .attr('pointer-events', 'visiblePainted')
                    .attr('stroke-width', 0)
                    .attr('cx', 0)
            }
            if (res.index === 1 && res.direction === "up") {
                genius
                    .transition(trans())
                    .attr('fill', "#FFFF64")
                    .attr('pointer-events', 'none')
                    .attr('stroke-width', 1)
                    
                geniuses
                    .transition(trans())
                    .attr('r', 0)
                    .attr('stroke', 'transparent')
                    .attr('fill', "transparent")

                axis.attr('visibility', 'hidden');
            }
            if (res.index === 2 && res.direction === "up") {
                geniuses
                    .transition(trans())
                    .attr('fill', "#FFFF64");
            }
            if (res.index === 3 && res.direction === "up") {
                sim.restart();

                geniuses = geniuses.data(swarm_data)
                    .join(
                        enter => enter,
                        update => update,
                        exit => exit.remove()
                    );

                sim.nodes(swarm_data)
                sim.alpha(1).restart();

                set_mouse(geniuses);
            }
        })

    const cheight = 200 * 98;
    let cdata = await d3.json('./test.json');

    const lm = 50;

    let yScale = d3.scaleTime()
        .domain(d3.extent(cdata, d => time(d))).nice(d3.timeDay.every(1))
        .range([margin.top, cheight - margin.bottom]);

    let cal = d3.select('#calendar')
        .attr('viewBox', [0, 0, width, cheight])
        .attr('font-family', 'sans-serif')

    let dformat = d3.timeFormat('%b %d')

    cal.append('g')
        .attr('transform', `translate(0, 0)`)
        .call(d3
            .axisRight(yScale)
            .tickFormat((d, i) => (i % 4 === 0) ? dformat(d) : tformat(d))
            .ticks(d3.timeHour.every(6))
            .tickSize(width - margin.right)
            )
        .call(g => g.select('.domain').remove())
        .call(g => {
            g.selectAll('.tick line').filter(Number)
                .attr('stroke', '#c0c0c0')
                .attr('stroke-dasharray', '2,2')
            g.selectAll('.tick text')
                .attr('x', 0)
                .attr('dy', -5)
                .attr('font-weight', (d, i) => (i % 4 === 0) ? 'bold': 'normal')
                .attr('text-anchor', 'start')
        })

    cal.selectAll('circle')
        .data(cdata)
        .join('circle')
            .attr('r', 3)
            .attr('cx', d => (Math.random() * (width - lm - margin.right)) + lm)
            .attr('cy', d => yScale(time(d)))
            .attr('fill', 'gray')
    draw_head();
}