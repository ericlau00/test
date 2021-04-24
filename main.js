const delay = time => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};

window.onload = async () => {    
    let head = document.getElementById('head-graphic');
    let domain_set = await d3.json('./domain_set.json');


    for (const domain of domain_set) {
        for (const letter of domain) {
            await delay(100);
            head.textContent += letter;
        }
    }
}