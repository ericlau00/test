const delay = time => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

window.onload = async () => {    
    let domain_top = await d3.json('./domain_top.json');
    console.log(domain_top.length);

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
            .attr('fill', d => 'color' in d.data ? d.data.color : 'gray')

    let tooltip = 
        d3.select('body')
            .append('div')
                .attr('class', 'd3-tip')
                .style('position', 'absolute')
                .style('visibility', 'hidden')

    circle
        .on('mouseenter', function(e, d) {
            let domain = d.data.domain;
            let label = ("label" in d.data) 
                ? d.data.label 
                : domain.charAt(0).toUpperCase() + domain.slice(1)

            tooltip
                .style('visibility', 'visible')
                .html(`
                    <b>${label}</b> (${domain})<br>
                    ${d.data.visits} visits`)
            d3.select(this)
                .attr('stroke-width', 1)
        })
        .on('mousemove', function(e) {
            let x = e.pageX + 5;
            let shift = (x > width * 0.8) ? x - 170 : x;
            tooltip
                .style('visibility', 'visible')
                .style('top', `${e.pageY - 30}px`)
                .style('left', `${shift}px`)
        })
        .on('mouseleave', function() {
            tooltip
                .style('visibility', 'hidden');
            d3.select(this)
                .attr('stroke-width', 0)
        })

    let head = document.getElementById('head-graphic');
    let domain_set = await d3.json('./domain_set.json');

    for (const domain of domain_set) {
        for (const letter of domain) {
            await delay(100);
            head.textContent += letter;
        }
    }
        
}