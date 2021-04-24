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
            .attr('fill', d => 'color' in d.data ? d.data.color : 'gray')

    let head = document.getElementById('head-graphic');
    let domain_set = await d3.json('./domain_set.json');

    for (const domain of domain_set) {
        for (const letter of domain) {
            await delay(100);
            head.textContent += letter;
        }
    }
        
}