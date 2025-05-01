// Initialize data
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    currency: 'USD',
    currencyPosition: 'before',
    dateFormat: 'MM/DD/YYYY'
};

// Define category options
const expenseCategories = [
    "Housing", "Utilities", "Groceries", "Dining", "Transportation", 
    "Healthcare", "Entertainment", "Shopping", "Personal Care", 
    "Education", "Travel", "Debt Payments", "Gifts", "Investments", "Miscellaneous"
];

const incomeCategories = [
    "Salary", "Freelance", "Business", "Investments", "Rental Income", 
    "Dividends", "Interest", "Gifts", "Tax Refund", "Other Income"
];

// DOM Elements - Navigation
const dashboardBtn = document.getElementById('dashboard-btn');
const transactionsBtn = document.getElementById('transactions-btn');
const budgetsBtn = document.getElementById('budgets-btn');
const reportsBtn = document.getElementById('reports-btn');
const sections = document.querySelectorAll('.section');

// DOM Elements - Modals
const transactionModal = document.getElementById('transaction-modal');
const budgetModal = document.getElementById('budget-modal');
const settingsModal = document.getElementById('settings-modal');
const closeBtns = document.querySelectorAll('.close-modal');
const cancelBtns = document.querySelectorAll('.btn-cancel');

// DOM Elements - Add Buttons
const addTransactionBtns = document.querySelectorAll('#add-transaction-btn, #add-transaction-btn-2');
const addBudgetBtn = document.getElementById('add-budget-btn');
const settingsBtn = document.querySelector('.settings-btn');
const themeToggle = document.querySelector('.theme-toggle');

// DOM Elements - Forms
const transactionForm = document.getElementById('transaction-form');
const budgetForm = document.getElementById('budget-form');
const settingsForm = document.getElementById('settings-form');

// DOM Elements - Dashboard
const totalIncomeEl = document.querySelector('.total-income');
const totalExpensesEl = document.querySelector('.total-expenses');
const balanceEl = document.querySelector('.balance');
const savingsRateEl = document.querySelector('.savings-rate');
const recentTransactionsBody = document.getElementById('recent-transactions-body');

// DOM Elements - Transactions
const transactionsBody = document.getElementById('transactions-body');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterDate = document.getElementById('filter-date');
const searchTransaction = document.getElementById('search-transaction');

// DOM Elements - Budgets
const budgetsContainer = document.getElementById('budgets-container');
const totalBudgetEl = document.querySelector('.total-budget');
const budgetUsedEl = document.querySelector('.budget-used');
const budgetUsageRateEl = document.querySelector('.budget-usage-rate');

// DOM Elements - Reports
const reportType = document.getElementById('report-type');
const reportPeriod = document.getElementById('report-period');
const generateReportBtn = document.getElementById('generate-report-btn');
const exportReportBtn = document.getElementById('export-report-btn');
const reportSummaryContent = document.getElementById('report-summary-content');

// Charts
let monthlyChart;
let categoryChart;
let reportChart;

// Date formatting
function formatDate(dateString) {
    const date = new Date(dateString);
    switch(settings.dateFormat) {
        case 'MM/DD/YYYY':
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        case 'DD/MM/YYYY':
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        case 'YYYY-MM-DD':
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        default:
            return dateString;
    }
}

// Format currency
function formatCurrency(amount) {
    const currency = settings.currency || 'USD';
    const position = settings.currencyPosition || 'before';
    const formatted = new Intl.NumberFormat(settings.locale || 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);

    if (position === 'after') {
        const symbol = getCurrencySymbol(currency);
        return `${Math.abs(amount).toFixed(2)} ${symbol}`;
    }
    return formatted;
}

function getCurrencySymbol(currencyCode) {
    const symbols = {
        USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', INR: '₹', CNY: '¥', BRL: 'R$', ZAR: 'R',
        CHF: 'CHF', RUB: '₽', SGD: 'S$', HKD: 'HK$', KRW: '₩', MXN: '$', SEK: 'kr', NZD: 'NZ$', TRY: '₺', AED: 'د.إ'
    };
    return symbols[currencyCode] || currencyCode;
}

// Navigation
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${sectionId}-btn`).classList.add('active');
    // Refresh data when navigating
    if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'transactions') {
        loadTransactions();
    } else if (sectionId === 'budgets') {
        loadBudgets();
    } else if (sectionId === 'reports') {
        initializeReports();
    }
}

// Modal Controls
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function closeAllModals() {
    transactionModal.classList.remove('active');
    budgetModal.classList.remove('active');
    settingsModal.classList.remove('active');
}

// Transaction Functions
function addTransaction(transaction) {
    transactions.unshift(transaction); // Add to beginning of array
    saveTransactions();
    updateDashboard();
    showNotification('Transaction added successfully', 'success');
}

function updateTransaction(updatedTransaction) {
    const index = transactions.findIndex(t => t.id === updatedTransaction.id);
    if (index !== -1) {
        transactions[index] = updatedTransaction;
        saveTransactions();
        updateDashboard();
        loadTransactions();
        showNotification('Transaction updated successfully', 'success');
    }
}

function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDashboard();
        loadTransactions();
        showNotification('Transaction deleted successfully', 'success');
    }
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
    // Apply filters
    let filteredTransactions = [...transactions];
    const typeFilter = filterType.value;
    const categoryFilter = filterCategory.value;
    const dateFilter = filterDate.value;
    const searchQuery = searchTransaction.value.toLowerCase();

    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    if (dateFilter !== 'all') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        if (dateFilter === 'this-month') {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= startOfMonth);
        } else if (dateFilter === 'last-month') {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= startOfLastMonth && new Date(t.date) < startOfMonth);
        } else if (dateFilter === 'this-year') {
            filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= startOfYear);
        }
    }
    if (searchQuery) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.description.toLowerCase().includes(searchQuery) || 
            t.category.toLowerCase().includes(searchQuery)
        );
    }
    // Clear table
    transactionsBody.innerHTML = '';
    // Display transactions
    if (filteredTransactions.length === 0) {
        transactionsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">No transactions found. Add a transaction to get started!</td>
            </tr>
        `;
    } else {
        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td><span class="tag ${transaction.type}">${transaction.type}</span></td>
                <td class="actions">
                    <button class="btn-edit" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            transactionsBody.appendChild(row);
        });
    }
    // Set up event listeners for edit/delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editTransaction(id);
        });
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteTransaction(id);
        });
    });
    // Update the categories filter
    updateCategoryFilter();
}

function updateCategoryFilter() {
    // Clear options first
    filterCategory.innerHTML = '<option value="all">All Categories</option>';
    // Get unique categories from transactions
    const categories = [...new Set(transactions.map(t => t.category))];
    // Add categories to select
    categories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    });
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    document.getElementById('transaction-id').value = transaction.id;
    document.getElementById('modal-title').textContent = 'Edit Transaction';
    document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
    document.getElementById('transaction-amount').value = transaction.amount;
    document.getElementById('transaction-description').value = transaction.description;
    updateCategoryOptions(transaction.type);
    document.getElementById('transaction-category').value = transaction.category;
    document.getElementById('transaction-date').value = transaction.date;
    document.getElementById('transaction-notes').value = transaction.notes || '';
    openModal('transaction-modal');
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('transaction-category');
    categorySelect.innerHTML = '';
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Budget Functions
function addBudget(budget) {
    budgets.push(budget);
    saveBudgets();
    loadBudgets();
    showNotification('Budget added successfully', 'success');
}

function updateBudget(updatedBudget) {
    const index = budgets.findIndex(b => b.id === updatedBudget.id);
    if (index !== -1) {
        budgets[index] = updatedBudget;
        saveBudgets();
        loadBudgets();
        showNotification('Budget updated successfully', 'success');
    }
}

function deleteBudget(id) {
    if (confirm('Are you sure you want to delete this budget?')) {
        budgets = budgets.filter(b => b.id !== id);
        saveBudgets();
        loadBudgets();
        showNotification('Budget deleted successfully', 'success');
    }
}

function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

function loadBudgets() {
    // Clear container
    budgetsContainer.innerHTML = '';
    // Calculate total budget and used amount
    let totalBudget = 0;
    let totalUsed = 0;
    // Display budgets
    if (budgets.length === 0) {
        budgetsContainer.innerHTML = `
            <div class="empty-state">
                <p>No budgets found. Create a budget to start tracking your spending!</p>
            </div>
        `;
    } else {
        budgets.forEach(budget => {
            const spent = calculateSpentForBudget(budget);
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            totalBudget += budget.amount;
            totalUsed += spent;
            let progressClass = 'progress-normal';
            if (percentage >= 90) {
                progressClass = 'progress-danger';
            } else if (percentage >= 75) {
                progressClass = 'progress-warning';
            }
            const budgetCard = document.createElement('div');
            budgetCard.className = 'budget-card';
            budgetCard.innerHTML = `
                <div class="budget-header">
                    <h3>${budget.category}</h3>
                    <div class="actions">
                        <button class="btn-edit" data-id="${budget.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${budget.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="budget-amount">${formatCurrency(budget.amount)}</div>
                <div class="budget-progress">
                    <div class="progress-bar ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="budget-details">
                    <span>Spent: ${formatCurrency(spent)}</span>
                    <span>Remaining: ${formatCurrency(budget.amount - spent)}</span>
                </div>
                <div class="budget-details mt-2">
                    <span>Period: ${budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}</span>
                    <span>Started: ${formatDate(budget.startDate)}</span>
                </div>
            `;
            budgetsContainer.appendChild(budgetCard);
        });
    }
    // Update budget overview
    totalBudgetEl.textContent = formatCurrency(totalBudget);
    budgetUsedEl.textContent = formatCurrency(totalUsed);
    budgetUsageRateEl.textContent = totalBudget > 0 
        ? `${Math.round((totalUsed / totalBudget) * 100)}%` 
        : '0%';
    // Set up event listeners for edit/delete buttons
    document.querySelectorAll('.budget-card .btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            editBudget(id);
        });
    });
    document.querySelectorAll('.budget-card .btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteBudget(id);
        });
    });
}

function calculateSpentForBudget(budget) {
    const now = new Date();
    const startDate = new Date(budget.startDate);
    let endDate;
    if (budget.period === 'monthly') {
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + now.getMonth() - startDate.getMonth();
        if (monthsDiff > 0) {
            startDate.setMonth(startDate.getMonth() + monthsDiff);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        }
    } else if (budget.period === 'yearly') {
        endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1);
        const yearsDiff = now.getFullYear() - startDate.getFullYear();
        if (yearsDiff > 0) {
            startDate.setFullYear(startDate.getFullYear() + yearsDiff);
            endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1);
        }
    }
    const periodEnd = now > endDate ? endDate : now;
    const relevantTransactions = transactions.filter(t => 
        t.type === 'expense' && 
        t.category === budget.category && 
        new Date(t.date) >= startDate && 
        new Date(t.date) <= periodEnd
    );
    return relevantTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
}

function editBudget(id) {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;
    document.getElementById('budget-id').value = budget.id;
    document.getElementById('budget-modal-title').textContent = 'Edit Budget';
    document.getElementById('budget-category').value = budget.category;
    document.getElementById('budget-amount').value = budget.amount;
    document.getElementById('budget-period').value = budget.period;
    document.getElementById('budget-start-date').value = budget.startDate;
    openModal('budget-modal');
}

// Dashboard Functions
function updateDashboard() {
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += Number(transaction.amount);
        } else {
            totalExpenses += Number(transaction.amount);
        }
    });
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpensesEl.textContent = formatCurrency(totalExpenses);
    balanceEl.textContent = formatCurrency(balance);
    savingsRateEl.textContent = `${savingsRate}%`;
    loadRecentTransactions();
    updateMonthlyChart();
    updateCategoryChart();
}

function loadRecentTransactions() {
    recentTransactionsBody.innerHTML = '';
    const recentTransactions = transactions.slice(0, 5);
    if (recentTransactions.length === 0) {
        recentTransactionsBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">No transactions found. Add a transaction to get started!</td>
            </tr>
        `;
    } else {
        recentTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td><span class="tag ${transaction.type}">${transaction.type}</span></td>
            `;
            recentTransactionsBody.appendChild(row);
        });
    }
}

function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleString('default', { month: 'short' });
        labels.push(monthName);
        const monthIncome = transactions.filter(t => 
            t.type === 'income' && 
            new Date(t.date).getMonth() === month.getMonth() && 
            new Date(t.date).getFullYear() === month.getFullYear()
        ).reduce((sum, t) => sum + Number(t.amount), 0);
        const monthExpense = transactions.filter(t => 
            t.type === 'expense' && 
            new Date(t.date).getMonth() === month.getMonth() && 
            new Date(t.date).getFullYear() === month.getFullYear()
        ).reduce((sum, t) => sum + Number(t.amount), 0);
        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
    }
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(0, 184, 148, 0.7)',
                    borderColor: 'rgba(0, 184, 148, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(214, 48, 49, 0.7)',
                    borderColor: 'rgba(214, 48, 49, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

function updateCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    const categories = {};
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
        if (!categories[transaction.category]) {
            categories[transaction.category] = 0;
        }
        categories[transaction.category] += Number(transaction.amount);
    });
    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const labels = sortedCategories.map(c => c[0]);
    const data = sortedCategories.map(c => c[1]);
    const backgroundColors = [
        'rgba(108, 92, 231, 0.7)',
        'rgba(253, 121, 168, 0.7)',
        'rgba(253, 203, 110, 0.7)',
        'rgba(9, 132, 227, 0.7)',
        'rgba(0, 184, 148, 0.7)'
    ];
    if (categoryChart) {
        categoryChart.destroy();
    }
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// Report Functions
function initializeReports() {
    generateReport();
}

function generateReport() {
    const type = reportType.value;
    const period = reportPeriod.value;
    const now = new Date();
    let startDate;
    let endDate = now;
    if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        startDate = new Date(0);
    }
    const filteredTransactions = transactions.filter(t => 
        new Date(t.date) >= startDate && 
        new Date(t.date) <= endDate
    );
    if (type === 'income-expense') {
        generateIncomeExpenseReport(filteredTransactions, period);
    } else if (type === 'category-breakdown') {
        generateCategoryBreakdownReport(filteredTransactions);
    } else if (type === 'savings-trend') {
        generateSavingsTrendReport(period);
    }
}

function generateIncomeExpenseReport(filteredTransactions, period) {
    const ctx = document.getElementById('report-chart').getContext('2d');
    let labels = [];
    let incomeData = [];
    let expenseData = [];
    const now = new Date();
    if (period === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            labels.push(i.toString());
            const dayIncome = filteredTransactions.filter(t => 
                t.type === 'income' && 
                new Date(t.date).getDate() === i &&
                new Date(t.date).getMonth() === now.getMonth() &&
                new Date(t.date).getFullYear() === now.getFullYear()
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            const dayExpense = filteredTransactions.filter(t => 
                t.type === 'expense' && 
                new Date(t.date).getDate() === i &&
                new Date(t.date).getMonth() === now.getMonth() &&
                new Date(t.date).getFullYear() === now.getFullYear()
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            incomeData.push(dayIncome);
            expenseData.push(dayExpense);
        }
    } else if (period === 'quarter') {
        for (let i = 2; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            labels.push(monthName);
            const monthIncome = filteredTransactions.filter(t => 
                t.type === 'income' && 
                new Date(t.date).getMonth() === month.getMonth() && 
                new Date(t.date).getFullYear() === month.getFullYear()
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            const monthExpense = filteredTransactions.filter(t => 
                t.type === 'expense' && 
                new Date(t.date).getMonth() === month.getMonth() && 
                new Date(t.date).getFullYear() === month.getFullYear()
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            incomeData.push(monthIncome);
            expenseData.push(monthExpense);
        }
    } else if (period === 'year') {
        for (let i = 0; i < 12; i++) {
            const month = new Date(now.getFullYear(), i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            labels.push(monthName);
            const monthIncome = filteredTransactions.filter(t => 
                t.type === 'income' && 
                new Date(t.date).getMonth() === month.getMonth() && 
                new Date(t.date).getFullYear() === month.getFullYear()
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            const monthExpense = filteredTransactions.filter(t => 
                t.type === 'expense' && 
                new Date(t.date).getMonth() === month.getMonth() && 
                new Date(t.date).getFullYear() === month.getFullYear()
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            incomeData.push(monthIncome);
            expenseData.push(monthExpense);
        }
    } else {
        const years = [...new Set(filteredTransactions.map(t => new Date(t.date).getFullYear()))].sort();
        years.forEach(year => {
            labels.push(year.toString());
            const yearIncome = filteredTransactions.filter(t => 
                t.type === 'income' && 
                new Date(t.date).getFullYear() === year
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            const yearExpense = filteredTransactions.filter(t => 
                t.type === 'expense' && 
                new Date(t.date).getFullYear() === year
            ).reduce((sum, t) => sum + Number(t.amount), 0);
            incomeData.push(yearIncome);
            expenseData.push(yearExpense);
        });
    }
    if (reportChart) {
        reportChart.destroy();
    }
    reportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(0, 184, 148, 0.7)',
                    borderColor: 'rgba(0, 184, 148, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(214, 48, 49, 0.7)',
                    borderColor: 'rgba(214, 48, 49, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
    const totalIncome = filteredTransactions.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    reportSummaryContent.innerHTML = `
        <div class="summary-item">
            <div class="label">Total Income:</div>
            <div class="value">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Expenses:</div>
            <div class="value">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Net Savings:</div>
            <div class="value ${netSavings >= 0 ? 'positive' : 'negative'}">${formatCurrency(netSavings)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Savings Rate:</div>
            <div class="value ${savingsRate >= 0 ? 'positive' : 'negative'}">${savingsRate}%</div>
        </div>
    `;
}

function generateCategoryBreakdownReport(filteredTransactions) {
    const ctx = document.getElementById('report-chart').getContext('2d');
    const expenseCategories = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(transaction => {
        if (!expenseCategories[transaction.category]) {
            expenseCategories[transaction.category] = 0;
        }
        expenseCategories[transaction.category] += Number(transaction.amount);
    });
    const sortedExpenseCategories = Object.entries(expenseCategories)
        .sort((a, b) => b[1] - a[1]);
    const labels = sortedExpenseCategories.map(c => c[0]);
    const data = sortedExpenseCategories.map(c => c[1]);
    const backgroundColors = [
        'rgba(108, 92, 231, 0.7)',
        'rgba(253, 121, 168, 0.7)',
        'rgba(253, 203, 110, 0.7)',
        'rgba(9, 132, 227, 0.7)',
        'rgba(0, 184, 148, 0.7)',
        'rgba(214, 48, 49, 0.7)',
        'rgba(45, 52, 54, 0.7)',
        'rgba(232, 67, 147, 0.7)',
        'rgba(46, 204, 113, 0.7)',
        'rgba(236, 240, 241, 0.7)'
    ];
    const colors = labels.map((_, i) => backgroundColors[i % backgroundColors.length]);
    if (reportChart) {
        reportChart.destroy();
    }
    reportChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                }
            }
        }
    });
    const totalExpense = data.reduce((sum, amount) => sum + amount, 0);
    let summaryHTML = `
        <div class="summary-item">
            <div class="label">Total Expenses:</div>
            <div class="value">${formatCurrency(totalExpense)}</div>
        </div>
    `;
    const top5Categories = sortedExpenseCategories.slice(0, 5);
    if (top5Categories.length > 0) {
        summaryHTML += `<div class="summary-section">Top Categories:</div>`;
        top5Categories.forEach(([category, amount]) => {
            const percentage = Math.round((amount / totalExpense) * 100);
            summaryHTML += `
                <div class="summary-item">
                    <div class="label">${category}:</div>
                    <div class="value">${formatCurrency(amount)} (${percentage}%)</div>
                </div>
            `;
        });
    }
    reportSummaryContent.innerHTML = summaryHTML;
}

function generateSavingsTrendReport(period) {
    const ctx = document.getElementById('report-chart').getContext('2d');
    let labels = [];
    let savingsData = [];
    let savingsRateData = [];
    const now = new Date();
    let dataPoints;
    if (period === 'month') {
        dataPoints = 4;
        const weeksInMonth = Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7);
        for (let i = 0; i < weeksInMonth; i++) {
            const weekStart = new Date(now.getFullYear(), now.getMonth(), i * 7 + 1);
            const weekEnd = new Date(now.getFullYear(), now.getMonth(), i * 7 + 7);
            if (weekEnd > now) {
                weekEnd.setTime(now.getTime());
            }
            labels.push(`Week ${i + 1}`);
            const weekTransactions = transactions.filter(t => 
                new Date(t.date) >= weekStart && 
                new Date(t.date) <= weekEnd
            );
            const weekIncome = weekTransactions.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const weekExpense = weekTransactions.filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const savings = weekIncome - weekExpense;
            const savingsRate = weekIncome > 0 ? (savings / weekIncome) * 100 : 0;
            savingsData.push(savings);
            savingsRateData.push(savingsRate);
        }
    } else if (period === 'quarter') {
        dataPoints = 3;
        for (let i = 2; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            const monthName = month.toLocaleString('default', { month: 'short' });
            labels.push(monthName);
            const monthTransactions = transactions.filter(t => 
                new Date(t.date) >= month && 
                new Date(t.date) <= monthEnd
            );
            const monthIncome = monthTransactions.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const monthExpense = monthTransactions.filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const savings = monthIncome - monthExpense;
            const savingsRate = monthIncome > 0 ? (savings / monthIncome) * 100 : 0;
            savingsData.push(savings);
            savingsRateData.push(savingsRate);
        }
    } else if (period === 'year') {
        dataPoints = 4;
        for (let i = 0; i < 4; i++) {
            const quarterStart = new Date(now.getFullYear(), i * 3, 1);
            const quarterEnd = new Date(now.getFullYear(), i * 3 + 3, 0);
            if (quarterEnd > now) {
                quarterEnd.setTime(now.getTime());
            }
            labels.push(`Q${i + 1}`);
            const quarterTransactions = transactions.filter(t => 
                new Date(t.date) >= quarterStart && 
                new Date(t.date) <= quarterEnd
            );
            const quarterIncome = quarterTransactions.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const quarterExpense = quarterTransactions.filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const savings = quarterIncome - quarterExpense;
            const savingsRate = quarterIncome > 0 ? (savings / quarterIncome) * 100 : 0;
            savingsData.push(savings);
            savingsRateData.push(savingsRate);
        }
    } else {
        const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort();
        dataPoints = years.length;
        years.forEach(year => {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);
            if (yearEnd > now) {
                yearEnd.setTime(now.getTime());
            }
            labels.push(year.toString());
            const yearTransactions = transactions.filter(t => 
                new Date(t.date) >= yearStart && 
                new Date(t.date) <= yearEnd
            );
            const yearIncome = yearTransactions.filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const yearExpense = yearTransactions.filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const savings = yearIncome - yearExpense;
            const savingsRate = yearIncome > 0 ? (savings / yearIncome) * 100 : 0;
            savingsData.push(savings);
            savingsRateData.push(savingsRate);
        });
    }
    if (reportChart) {
        reportChart.destroy();
    }
    reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Savings',
                    data: savingsData,
                    backgroundColor: 'rgba(9, 132, 227, 0.2)',
                    borderColor: 'rgba(9, 132, 227, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Savings Rate (%)',
                    data: savingsRateData,
                    backgroundColor: 'rgba(253, 121, 168, 0.2)',
                    borderColor: 'rgba(253, 121, 168, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Amount'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Percentage (%)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
    const totalSavings = savingsData.reduce((sum, saving) => sum + saving, 0);
    const avgSavingsRate = savingsRateData.reduce((sum, rate) => sum + rate, 0) / dataPoints;
    let trend = 'steady';
    if (savingsData.length >= 2) {
        if (savingsData[savingsData.length - 1] > savingsData[0]) {
            trend = 'increasing';
        } else if (savingsData[savingsData.length - 1] < savingsData[0]) {
            trend = 'decreasing';
        }
    }
    reportSummaryContent.innerHTML = `
        <div class="summary-item">
            <div class="label">Total Savings:</div>
            <div class="value ${totalSavings >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalSavings)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Average Savings Rate:</div>
            <div class="value ${avgSavingsRate >= 0 ? 'positive' : 'negative'}">${Math.round(avgSavingsRate)}%</div>
        </div>
        <div class="summary-item">
            <div class="label">Trend:</div>
            <div class="value">${trend.charAt(0).toUpperCase() + trend.slice(1)}</div>
        </div>
    `;
}

function exportReport() {
    const type = reportType.value;
    const period = reportPeriod.value;
    const canvas = document.getElementById('report-chart');
    const chartImage = canvas.toDataURL('image/png');
    const summary = reportSummaryContent.innerText;
    let title = '';
    if (type === 'income-expense') {
        title = 'Income vs Expenses Report';
    } else if (type === 'category-breakdown') {
        title = 'Expense Categories Breakdown Report';
    } else if (type === 'savings-trend') {
        title = 'Savings Trend Report';
    }
    let periodText = '';
    if (period === 'month') {
        periodText = 'Current Month';
    } else if (period === 'quarter') {
        periodText = 'Last 3 Months';
    } else if (period === 'year') {
        periodText = 'Current Year';
    } else {
        periodText = 'All Time';
    }
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - ${periodText}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2 {
                    color: #2980b9;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .chart-container {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .chart-container img {
                    max-width: 100%;
                    height: auto;
                }
                .summary-container {
                    background-color: #f9f9f9;
                    padding: 20px;
                    border-radius: 5px;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 0.9em;
                    color: #7f8c8d;
                }
                .positive { color: #27ae60; }
                .negative { color: #e74c3c; }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>${title}</h1>
                <h2>${periodText}</h2>
                <p>Generated on: ${formatDate(new Date())}</p>
            </div>
            <div class="chart-container">
                <img src="${chartImage}" alt="Report Chart">
            </div>
            <div class="summary-container">
                <h2>Summary</h2>
                <pre>${summary}</pre>
            </div>
            <div class="footer">
                <p>Generated by Personal Finance Tracker</p>
            </div>
        </body>
        </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${periodText.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

// Settings Functions
function updateSettings(newSettings) {
    settings = {...settings, ...newSettings};
    localStorage.setItem('settings', JSON.stringify(settings));
    updateDashboard();
    loadTransactions();
    loadBudgets();
    showNotification('Settings updated successfully', 'success');
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('dark-theme', isDarkTheme);
}

// Initialize functions
function init() {
    const isDarkTheme = localStorage.getItem('dark-theme') === 'true';
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
    }
    dashboardBtn.addEventListener('click', () => showSection('dashboard'));
    transactionsBtn.addEventListener('click', () => showSection('transactions'));
    budgetsBtn.addEventListener('click', () => showSection('budgets'));
    reportsBtn.addEventListener('click', () => showSection('reports'));
    addTransactionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('transaction-id').value = '';
            document.getElementById('modal-title').textContent = 'Add Transaction';
            transactionForm.reset();
            document.querySelector('input[name="type"][value="expense"]').checked = true;
            updateCategoryOptions('expense');
            document.getElementById('transaction-date').valueAsDate = new Date();
            openModal('transaction-modal');
        });
    });
    addBudgetBtn.addEventListener('click', () => {
        document.getElementById('budget-id').value = '';
        document.getElementById('budget-modal-title').textContent = 'Add Budget';
        budgetForm.reset();
        document.getElementById('budget-period').value = 'monthly';
        document.getElementById('budget-start-date').valueAsDate = new Date();
        const categorySelect = document.getElementById('budget-category');
        categorySelect.innerHTML = '';
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        openModal('budget-modal');
    });
    settingsBtn.addEventListener('click', () => {
        document.getElementById('settings-currency').value = settings.currency;
        document.getElementById('settings-currency-position').value = settings.currencyPosition;
        document.getElementById('settings-date-format').value = settings.dateFormat;
        openModal('settings-modal');
    });
    themeToggle.addEventListener('click', toggleTheme);
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('transaction-id').value || Date.now().toString();
        const type = document.querySelector('input[name="type"]:checked').value;
        let amount = parseFloat(document.getElementById('transaction-amount').value);
        const description = document.getElementById('transaction-description').value;
        const category = document.getElementById('transaction-category').value;
        const date = document.getElementById('transaction-date').value;
        const notes = document.getElementById('transaction-notes').value;
        amount = Math.abs(amount);
        const transaction = { id, type, amount, description, category, date, notes };
        if (document.getElementById('transaction-id').value) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
        closeModal('transaction-modal');
        loadTransactions();
    });
    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('budget-id').value || Date.now().toString();
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value);
        const period = document.getElementById('budget-period').value;
        const startDate = document.getElementById('budget-start-date').value;
        const budget = { id, category, amount, period, startDate };
        if (document.getElementById('budget-id').value) {
            updateBudget(budget);
        } else {
            addBudget(budget);
        }
        closeModal('budget-modal');
    });
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currency = document.getElementById('settings-currency').value;
        const currencyPosition = document.getElementById('settings-currency-position').value;
        const dateFormat = document.getElementById('settings-date-format').value;
        updateSettings({ currency, currencyPosition, dateFormat });
        closeModal('settings-modal');
    });
    filterType.addEventListener('change', loadTransactions);
    filterCategory.addEventListener('change', loadTransactions);
    filterDate.addEventListener('change', loadTransactions);
    searchTransaction.addEventListener('input', loadTransactions);
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCategoryOptions(e.target.value);
        });
    });
    reportType.addEventListener('change', generateReport);
    reportPeriod.addEventListener('change', generateReport);
    generateReportBtn.addEventListener('click', generateReport);
    exportReportBtn.addEventListener('click', exportReport);
    showSection('dashboard');

    // --- Profile Modal Logic ---
    document.getElementById('profile-btn').addEventListener('click', () => openModal('profile-modal'));
    document.querySelectorAll('#profile-modal .close-modal, #profile-modal .btn-cancel').forEach(btn =>
      btn.addEventListener('click', () => closeModal('profile-modal'))
    );
    document.getElementById('profile-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('profile-name').value.trim();
      const fileInput = document.getElementById('profile-picture');
      let imgData = null;
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          imgData = evt.target.result;
          saveProfile(name, imgData);
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        saveProfile(name, null);
      }
      closeModal('profile-modal');
    });

    function saveProfile(name, imgData) {
      localStorage.setItem('profileName', name);
      if (imgData) localStorage.setItem('profileImg', imgData);
      updateProfileUI();
      showNotification('Profile updated!', 'success');
    }

    function updateProfileUI() {
      const name = localStorage.getItem('profileName') || 'JS';
      const img = localStorage.getItem('profileImg');
      const profile = document.getElementById('profile-btn');
      if (img) {
        profile.innerHTML = `<img src="${img}" alt="Profile" style="width:100%;height:100%;border-radius:50%;">`;
      } else {
        profile.textContent = name.length > 2 ? name.slice(0,2).toUpperCase() : name.toUpperCase();
      }
    }
    updateProfileUI();

    // --- Help Modal Logic ---
    document.getElementById('help-btn').addEventListener('click', () => openModal('help-modal'));
    document.querySelectorAll('#help-modal .close-modal').forEach(btn =>
      btn.addEventListener('click', () => closeModal('help-modal'))
    );

    // --- Reset Data Logic ---
    document.getElementById('reset-data-btn').addEventListener('click', function() {
      if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });

    // --- Theme Selector Logic ---
    document.getElementById('settings-theme').addEventListener('change', function() {
      setTheme(this.value);
      saveSettings();
    });
    function setTheme(theme) {
      document.body.classList.remove('dark-theme', 'theme-sunset', 'theme-mint');
      if (theme === 'dark') document.body.classList.add('dark-theme');
      else if (theme === 'sunset') document.body.classList.add('theme-sunset');
      else if (theme === 'mint') document.body.classList.add('theme-mint');
    }
    function saveSettings() {
      const theme = document.getElementById('settings-theme').value;
      localStorage.setItem('theme', theme);
    }
    function loadSettings() {
      const theme = localStorage.getItem('theme') || 'default';
      document.getElementById('settings-theme').value = theme;
      setTheme(theme);
    }
    loadSettings();

    document.getElementById('footer-about-link').addEventListener('click', function(e) {
      e.preventDefault();
      openModal('help-modal');
    });
    document.getElementById('footer-privacy-link').addEventListener('click', function(e) {
      e.preventDefault();
      openModal('privacy-modal');
    });
    document.querySelectorAll('#privacy-modal .close-modal').forEach(btn =>
      btn.addEventListener('click', () => closeModal('privacy-modal'))
    );
}

// Initialize the app
init();