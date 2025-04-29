let calculatedResults = []; // Store results for reuse when updating target

document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');
    calculateBtn.addEventListener('click', calculatePoints);
    
    // Add event listeners to table headers for sorting
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            sortTable(header.getAttribute('data-sort'));
        });
    });
    
    // Add event listener for target points changes
    document.getElementById('targetPoints').addEventListener('input', calculatePoints);
    // Used to call targetHighlighting
});

function parseData(text) {
    const students = [];
    
    if (!text || text.trim() === '') {
        return students;
    }
    
    // Split by lines and filter out empty lines and the header
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('**'));
    
    lines.forEach(line => {
        // Use regex to extract the name and attempts
        const match = line.match(/([A-Za-z]+, [A-Za-z]+).*?(\d+)/);
        
        if (match && match.length >= 3) {
            const name = match[1].trim();
            const attempts = parseInt(match[2], 10);
            
            students.push({
                name,
                attempts: isNaN(attempts) ? 0 : attempts
            });
        }
    });
    
    return students;
}

function calculatePoints() {
    // Get points values
    const quizPointsValue = parseInt(document.getElementById('quizPoints').value, 10) || 1;
    const termsPointsValue = parseInt(document.getElementById('termsPoints').value, 10) || 3;
    const advancedPointsValue = parseInt(document.getElementById('advancedPoints').value, 10) || 8;
    const targetValue = parseInt(document.getElementById('targetPoints').value, 10) || 8;
    
    // Parse data from text areas
    const quizData = parseData(document.getElementById('quizMode').value);
    const termsData = parseData(document.getElementById('termsMode').value);
    const advancedData = parseData(document.getElementById('advancedMode').value);
    
    // Combine all students' data
    const allStudents = {};
    
    // Process quiz data
    quizData.forEach(student => {
        if (!allStudents[student.name]) {
            allStudents[student.name] = {
                name: student.name,
                quizAttempts: 0,
                termsAttempts: 0,
                advancedAttempts: 0
            };
        }
        allStudents[student.name].quizAttempts = student.attempts;
    });
    
    // Process terms data
    termsData.forEach(student => {
        if (!allStudents[student.name]) {
            allStudents[student.name] = {
                name: student.name,
                quizAttempts: 0,
                termsAttempts: 0,
                advancedAttempts: 0
            };
        }
        allStudents[student.name].termsAttempts = student.attempts;
    });
    
    // Process advanced data
    advancedData.forEach(student => {
        if (!allStudents[student.name]) {
            allStudents[student.name] = {
                name: student.name,
                quizAttempts: 0,
                termsAttempts: 0,
                advancedAttempts: 0
            };
        }
        allStudents[student.name].advancedAttempts = student.attempts;
    });
    
    // Calculate total points for each student
    calculatedResults = Object.values(allStudents).map(student => {
        const quizPoints = student.quizAttempts * quizPointsValue;
        const termsPoints = student.termsAttempts * termsPointsValue;
        const advancedPoints = student.advancedAttempts * advancedPointsValue;
        const totalPoints = quizPoints + termsPoints + advancedPoints;
        const toGo = targetValue - totalPoints;
        
        return {
            ...student,
            totalPoints,
            toGo
        };
    });
    
    // Sort results by name (default)
    calculatedResults.sort((a, b) => a.name.localeCompare(b.name));
    
    // Display results
    displayResults();
}

function displayResults() {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    if (calculatedResults.length === 0) {
        // Show no data message
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px;">No data available. Please enter student data and calculate points.</td>';
        tbody.appendChild(row);
        return;
    }
    
    calculatedResults.forEach(student => {
        const row = document.createElement('tr');
        
        row.dataset.points = student.totalPoints; // Store points as data attribute for easy access
        
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.quizAttempts}</td>
            <td>${student.termsAttempts}</td>
            <td>${student.advancedAttempts}</td>
            <td>${student.totalPoints}</td>
            <td>${student.toGo}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Apply target highlighting
    updateTargetHighlighting();
}

function updateTargetHighlighting() {
    const targetPoints = parseInt(document.getElementById('targetPoints').value, 10) || 0;
    const rows = document.querySelectorAll('#resultsBody tr');
    
    rows.forEach(row => {
        if (row.cells.length === 1) return; // Skip the "no data" row
        
        const points = parseInt(row.dataset.points, 10);
        
        // Remove existing classes
        row.classList.remove('below-target', 'above-target');
        
        // Add appropriate class
        if (points < targetPoints) {
            row.classList.add('below-target');
        } else {
            row.classList.add('above-target');
        }
    });
}

let currentSort = {
    column: 'name',
    direction: 'asc'
};

function sortTable(column) {
    // Update sorting direction
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Update header classes
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        header.classList.add('sort-icon');
        
        if (header.getAttribute('data-sort') === column) {
            header.classList.remove('sort-icon');
            header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
    
    // Skip sorting if no data
    if (calculatedResults.length === 0) return;
    
    // Get all rows from the table
    const tbody = document.getElementById('resultsBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Sort rows
    rows.sort((a, b) => {
        if (a.cells.length === 1 || b.cells.length === 1) return 0; // Skip "no data" row
        
        let aValue, bValue;
        
        if (column === 'name') {
            aValue = a.cells[0].textContent;
            bValue = b.cells[0].textContent;
            return currentSort.direction === 'asc' 
                ? aValue.localeCompare(bValue) 
                : bValue.localeCompare(aValue);
        } else if (column === 'points') {
            aValue = parseInt(a.dataset.points, 10);
            bValue = parseInt(b.dataset.points, 10);
            return currentSort.direction === 'asc' 
                ? aValue - bValue 
                : bValue - aValue;
        }
        
        return 0;
    });
    
    // Re-append sorted rows to the table
    rows.forEach(row => tbody.appendChild(row));
}