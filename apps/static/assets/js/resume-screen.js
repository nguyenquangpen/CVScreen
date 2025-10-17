document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('resultsTableBody');

    const totalResumesEl = document.getElementById('total-resumes-count');
    const excellentMatchesEl = document.getElementById('excellent-matches-count');
    const goodMatchesEl = document.getElementById('good-matches-count');

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');


    function getStatusInfo(score) {
        score = parseFloat(score) || 0;
        if (score >= 75) {
            return { textClass: 'text-success', badgeText: 'Excellent', badgeClass: 'bg-success' };
        } else if (score >= 50) {
            return { textClass: 'text-warning', badgeText: 'Good', badgeClass: 'bg-warning text-dark' };
        } else {
            return { textClass: 'text-danger', badgeText: 'Needs Improvement', badgeClass: 'bg-danger' };
        }
    }

    function createTableRow(result) {
        const statusInfo = getStatusInfo(result.score);
        const scoreNum = parseFloat(result.score) || 0;
        const scoreFormatted = scoreNum.toFixed(1);

        return `
        <tr class="${statusInfo.textClass}" data-id="${result.id}">
            <td class="fw-medium">${result.resume_name}</td>
            <td class="text-center">${result.degree}</td>
            <td>${result.email}</td>
            <td class="text-center fw-bold">${scoreFormatted}</td>
            <td class="text-center">
                <span class="badge ${statusInfo.badgeClass}">${statusInfo.badgeText}</span>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${result.id}">
                    Delete
                </button>
            </td>
        </tr>
        `;
    }

    async function apiDeleteResult(id) {
        const url = `/api/resumes-new/${id}/delete/`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
    }

    tableBody.addEventListener('click', function(event) {
        const clickedRow = event.target.closest('tr');
        if (!clickedRow) return;

        if (event.target.classList.contains('btn-delete')) {
            const resultId = event.target.dataset.id;
            if (confirm(`Are you sure you want to delete this result?`)) {
                apiDeleteResult(resultId)
                    .then(() => {
                        clickedRow.remove();
                    })
                    .catch(error => {
                        console.error('Failed to delete result:', error);
                        alert(`Error: ${error.message}`);
                    });
            }
        }
        else {
            const resultId = clickedRow.dataset.id;
            if (resultId) {
                window.location.href = `/detailed-profile/${resultId}/`;
            }
        }
    });

    /**
    * @param {Array} results
    */

    function updateSummaryCards(results) {
        if (!results) {
            totalResumesEl.textContent = '0';
            excellentMatchesEl.textContent = '0';
            goodMatchesEl.textContent = '0';
            return;
        }

        const totalCount = results.length;

        const excellentCount = results.filter(r => parseFloat(r.score) >= 75).length;

        const goodCount = results.filter(r => {
            const score = parseFloat(r.score);
            return score >= 50 && score < 75;
        }).length;

        totalResumesEl.textContent = totalCount;
        excellentMatchesEl.textContent = excellentCount;
        goodMatchesEl.textContent = goodCount;
    }

    async function fetchResults() {
        try {
            const response = await fetch('/api/resumes-new/');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const results = await response.json();

            updateSummaryCards(results);

            if (results.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No resumes found.</td></tr>';
                return;
            }
            results.sort((a, b) => b.score - a.score);

            const tableRowsHtml = results.map(createTableRow).join('');
            tableBody.innerHTML = tableRowsHtml;
        } catch (error) {
            console.error('Error fetching results:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading resumes.</td></tr>';
        }
    }

    fetchResults();

});
