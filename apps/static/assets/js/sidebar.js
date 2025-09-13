document.addEventListener('DOMContentLoaded', function(){
    const sidebarlinks = document.querySelectorAll('.nav-link');

    sidebarlinks.forEach(link => link.classList.remove('active'));

    const currentPath = window.location.pathname;

    sidebarlinks.forEach(link => {
        let linkHref = link.getAttribute('href');

        if (linkHref && linkHref.endsWith('/') && linkHref.length > 1) {
            linkHref = linkHref.slice(0, -1);
        }

        if (currentPath.startsWith(linkHref)) {
            link.classList.add('active');

            localStorage.setItem("activeSidebarId", link.id);
        }
    });

    sidebarlinks.forEach(link => {
        link.addEventListener('click', function(event){
            localStorage.setItem("activeSidebarId", this.id);
        });
    });
});