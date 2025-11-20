document.addEventListener('DOMContentLoaded', function() {
    const resultsContainer = document.getElementById('results-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const pageContent = document.getElementById('page-content');

    const skillModal = document.getElementById('skill-modal');
    const modalCandidateName = document.getElementById('modal-candidate-name');
    const modalSkillsContent = document.getElementById('modal-skills-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let allResultsData = [];

    /**
     * @returns {number|null}
     */
    function getIdFromUrl() {
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const id = parseInt(pathParts[pathParts.length - 1], 10);
        return isNaN(id) ? null : id;
    }

    function showSkillModal(result) {
        if (!result) return;

        // Cập nhật nội dung modal
        const candidateName = result.candidate_info?.name || result.resume_filename || 'Candidate';
        modalCandidateName.textContent = `Skills of ${candidateName}`;

        modalSkillsContent.innerHTML = '';
        const skills = result.candidate_skills || [];
        if (skills.length > 0) {
            const skillsHtml = skills.map(skill =>
                `<span class="badge bg-primary fs-6 me-2 mb-2 p-2">${skill}</span>`
            ).join('');
            modalSkillsContent.innerHTML = skillsHtml;
        } else {
            modalSkillsContent.innerHTML = '<p class="text-muted">No skills listed for this candidate.</p>';
        }

        skillModal.classList.add('visible');
        pageContent.classList.add('content-blur');

        const newUrl = `/detailed-profile/${result.id}/`;
        const state = { resultId: result.id };
        history.pushState(state, '', newUrl)
    }

    function hideSkillModal() {
        skillModal.classList.remove('visible');
        pageContent.classList.remove('content-blur');

        const newUrl = '/detailed-profile/';
        history.pushState({}, '', newUrl);
    }

    modalCloseBtn.addEventListener('click', hideSkillModal);
    skillModal.addEventListener('click', function(event) {
        if (event.target === skillModal) {
            hideSkillModal();
        }
    });


    async function fetchResultsData() {
        console.log("--- [LOG FRONTEND] Bắt đầu gọi API: /api/all-match-results/ ---");
        try {
            const response = await fetch(`/api/all-match-results/`);

            console.log("--- [LOG FRONTEND] Nhận được response từ server, status:", response.status);

            if (!response.ok) {
                console.error("--- [LOG FRONTEND] Lỗi! Response không OK.", response);
                throw new Error(`Network response was not ok. Status: ${response.status}`);
            }

            const data = await response.json();

            console.log("--- [LOG FRONTEND] Dữ liệu JSON đã parse:", data);

            return data;
        } catch (error) {
            console.error('Error fetching results data:', error);
            loadingSpinner.style.display = 'none';
            errorMessage.textContent = 'Failed to load candidate data. Please try again later.';
            errorMessage.style.display = 'block';
            return null;
        }
    }

    /**
     * @param {Array} results
     */
    function renderResults(results) {
        loadingSpinner.style.display = 'none';

        if (!results || results.length === 0) {
            errorMessage.textContent = 'No candidates found in the database.';
            errorMessage.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = '';

        results.forEach(result => {
            const candidateInfo = result.candidate_info || {};
            const name = candidateInfo.name || result.resume_filename || 'N/A';
            const title = candidateInfo.degrees || 'Unknown Title';
            const avatar = '/static/assets/images/pixel.png';

            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6 col-sm-12';

            col.innerHTML = `
                <div class="card-container text-center rounded-4 bg-light shadow-sm p-4 h-100" data-result-id="${result.id}">
                    <img src="${avatar}" alt="${name}'s avatar" width="120" height="120" class="rounded-circle mb-3 border border-dark border-3 object-fit-cover mx-auto">
                    <h6 class="fw-semibold mb-1">${name}</h6>
                    <p class="small mb-2 opacity-75">${title}</p>
                    <div class="mt-auto">
                        <span class="badge bg-primary fs-6">Score: ${result.match_score.toFixed(2)}%</span>
                    </div>
                </div>
            `;
            resultsContainer.appendChild(col);
        });
    }

    resultsContainer.addEventListener('click', function(event) {
        const clickedCard = event.target.closest('.card-container');
        if (clickedCard) {
            const resultId = clickedCard.dataset.resultId;
            const selectedResult = allResultsData.find(r => r.id == resultId);
            showSkillModal(selectedResult);
        }
    });

    async function initializePage() {
        const idFromUrl = getIdFromUrl();
        const resultsData = await fetchResultsData();

        if (resultsData) {
            allResultsData = resultsData;
            renderResults(resultsData);

            if (idFromUrl) {
                const initialResult = allResultsData.find(r => r.id === idFromUrl);
                if (initialResult) {
                    setTimeout(() => {
                        showSkillModal(initialResult);
                    }, 100);
                } else {
                    console.warn(`Candidate with ID ${idFromUrl} not found.`);
                    history.replaceState({}, '', '/detailed-profile/');
                }
            }
        }
    }

    window.onpopstate = function() {
        const id = getIdFromUrl();
        if (id) {
            const result = allResultsData.find(r => r.id === id);
            if(result) showSkillModal(result);
        } else {
            hideSkillModal();
        }
    };

    initializePage();
});
