// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Global variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let currentTransactionId = JSON.parse(localStorage.getItem('currentTransactionId')) || 1;
let currentBudgetId = JSON.parse(localStorage.getItem('currentBudgetId')) || 1;
let isEditingTransaction = false;
let isEditingBudget = false;
let editingTransactionId = null;
let editingBudgetId = null;

// Income Categories
const incomeCategories = [
    'Salary', 'Freelance', 'Business', 'Investments', 
    'Rental Income', 'Gifts', 'Tax Refund', 'Other Income'
];

// Expense Categories
const expenseCategories = [
    'Food & Dining', 'Housing', 'Utilities', 'Transportation', 
    'Entertainment', 'Shopping', 'Health & Fitness', 'Personal Care',
    'Education', 'Travel', 'Debt Payments', 'Savings & Investments',
    'Gifts & Donations', 'Taxes', 'Miscellaneous'
];

// Initialize the application
function initApp() {
    // Set up navigation
    setupNavigation();
    
    // Set up theme toggle
    setupThemeToggle();
    
    // Load transactions and budgets
    updateDashboard();
    updateTransactionsTable();
    updateBudgets();
    
    // Set up transaction forms
    setupTransactionForm();
    
    // Set up budget form
    setupBudgetForm();
    
    // Set up action buttons
    setupActionButtons();
    
    // Set up reports
    setupReports();
    
    // Set date inputs to current date
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.value = today;
    });
}

// Set up navigation between sections
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and sections
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.id.replace('-btn', '');
            document.getElementById(targetSection).classList.add('active');
        });
    });
}

// Set up theme toggle
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'true');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('darkMode', 'false');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

// Set up transaction form
function setupTransactionForm() {
    // Populate category select in transaction form
    const transactionCategory = document.getElementById('transaction-category');
    populateCategorySelect(transactionCategory, 'income');
    
    // Change categories based on transaction type
    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            populateCategorySelect(transactionCategory, this.value);
        });
    });
    
    // Set up form submission
    const transactionForm = document.getElementById('transaction-form');
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveTransaction();
    });
    
    // Cancel button
    const cancelBtn = document.querySelector('#transaction-modal .btn-cancel');
    cancelBtn.addEventListener('click', function() {
        closeModal('transaction-modal');
    });
    
    // Close modal on X click
    const closeBtn = document.querySelector('#transaction-modal .close-modal');
    closeBtn.addEventListener('click', function() {
        closeModal('transaction-modal');
    });
}

// Populate category select based on transaction type
function populateCategorySelect(selectElement, type) {
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Get categories based on type
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    // Add categories to select
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });
}

// Set up budget form
function setupBudgetForm() {
    // Populate category select in budget form with expense categories only
    const budgetCategory = document.getElementById('budget-category');
    populateCategorySelect(budgetCategory, 'expense');
    
    // Set up form submission
    const budgetForm = document.getElementById('budget-form');
    budgetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveBudget();
    });
    
    // Cancel button
    const cancelBtn = document.querySelector('#budget-modal .btn-cancel');
    cancelBtn.addEventListener('click', function() {
        closeModal('budget-modal');
    });
    
    // Close modal on X click
    const closeBtn = document.querySelector('#budget-modal .close-modal');
    closeBtn.addEventListener('click', function() {
        closeModal('budget-modal');
    });
}

// Set up action buttons
function setupActionButtons() {
    // Add transaction buttons
    const addTransactionBtns = document.querySelectorAll('#add-transaction-btn, #add-transaction-btn-2');
    addTransactionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            openTransactionModal();
        });
    });
    
    // Add budget button
    const addBudgetBtn = document.getElementById('add-budget-btn');
    addBudgetBtn.addEventListener('click', function() {
        openBudgetModal();
    });
    
    // Report buttons
    const generateReportBtn = document.getElementById('generate-report-btn');
    generateReportBtn.addEventListener('click', function() {
        generateReport();
    });
    
    const exportReportBtn = document.getElementById('export-report-btn');
    exportReportBtn.addEventListener('click', function() {
        exportReport();
    });
}

// Open transaction modal
function openTransactionModal(transaction = null) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('transaction-form');
    
    // Reset form
    form.reset();
    
    // Set current date if not editing
    if (!transaction) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
    }
    
    if (transaction) {
        // Set modal for editing
        modalTitle.textContent = 'Edit Transaction';
        isEditingTransaction = true;
        editingTransactionId = transaction.id;
        
        // Fill form with transaction data
        document.getElementById('transaction-id').value = transaction.id;
        document.querySelector(`input[name="type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('transaction-amount').value = transaction.amount;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-notes').value = transaction.notes || '';
        
        // Populate category select based on transaction type
        const categorySelect = document.getElementById('transaction-category');
        populateCategorySelect(categorySelect, transaction.type);
        categorySelect.value = transaction.category;
    } else {
        // Set modal for adding
        modalTitle.textContent = 'Add Transaction';
        isEditingTransaction = false;
        editingTransactionId = null;
        document.getElementById('transaction-id').value = '';
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Open budget modal
function openBudgetModal(budget = null) {
    const modal = document.getElementById('budget-modal');
    const modalTitle = document.getElementById('budget-modal-title');
    const form = document.getElementById('budget-form');
    
    // Reset form
    form.reset();
    
    // Set current date if not editing
    if (!budget) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('budget-start-date').value = today;
    }
    
    if (budget) {
        // Set modal for editing
        modalTitle.textContent = 'Edit Budget';
        isEditingBudget = true;
        editingBudgetId = budget.id;
        
        // Fill form with budget data
        document.getElementById('budget-id').value = budget.id;
        document.getElementById('budget-category').value = budget.category;
        document.getElementById('budget-amount').value = budget.amount;
        document.getElementById('budget-period').value = budget.period;
        document.getElementById('budget-start-date').value = budget.startDate;
    } else {
        // Set modal for adding
        modalTitle.textContent = 'Add Budget';
        isEditingBudget = false;
        editingBudgetId = null;
        document.getElementById('budget-id').value = '';
    }
    
    // Show modal
    modal.style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Save transaction
function saveTransaction() {
    const id = isEditingTransaction ? editingTransactionId : currentTransactionId++;
    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const category = document.getElementById('transaction-category').value;
    const date = document.getElementById('transaction-date').value;
    const notes = document.getElementById('transaction-notes').value;
    
    const transaction = {
        id,
        type,
        amount,
        description,
        category,
        date,
        notes
    };
    
    if (isEditingTransaction) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = transaction;
        }
    } else {
        // Add new transaction
        transactions.push(transaction);
    }
    
    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('currentTransactionId', JSON.stringify(currentTransactionId));
    
    // Close modal
    closeModal('transaction-modal');
    
    // Update dashboard and transactions table
    updateDashboard();
    updateTransactionsTable();
    updateBudgets(); // Update budgets to reflect new spending
}

// Save budget
function saveBudget() {
    const id = isEditingBudget ? editingBudgetId : currentBudgetId++;
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);
    const period = document.getElementById('budget-period').value;
    const startDate = document.getElementById('budget-start-date').value;
    
    const budget = {
        id,
        category,
        amount,
        period,
        startDate
    };
    
    if (isEditingBudget) {
        // Update existing budget
        const index = budgets.findIndex(b => b.id === editingBudgetId);
        if (index !== -1) {
            budgets[index] = budget;
        }
    } else {
        // Add new budget
        budgets.push(budget);
    }
    
    // Save to localStorage
    localStorage.setItem('budgets', JSON.stringify(budgets));
    localStorage.setItem('currentBudgetId', JSON.stringify(currentBudgetId));
    
    // Close modal
    closeModal('budget-modal');
    
    // Update budgets
    updateBudgets();
}

// Update dashboard with transaction data
function updateDashboard() {
    // Calculate totals
    const totals = calculateTotals();
    
    // Update total displays
    document.querySelector('.total-income').textContent = formatCurrency(totals.income);
    document.querySelector('.total-expenses').textContent = formatCurrency(totals.expenses);
    document.querySelector('.balance').textContent = formatCurrency(totals.balance);
    
    // Calculate and update savings rate
    const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income * 100).toFixed(1) : 0;
    document.querySelector('.savings-rate').textContent = `${savingsRate}%`;
    
    // Update recent transactions table
    updateRecentTransactions();
    
    // Update charts
    updateDashboardCharts();
}

// Calculate total income, expenses, and balance
function calculateTotals(filterDate = null) {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        // Apply date filter if provided
        if (filterDate && !isTransactionInPeriod(transaction, filterDate)) {
            return;
        }
        
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    const balance = totalIncome - totalExpenses;
    
    return {
        income: totalIncome,
        expenses: totalExpenses,
        balance: balance
    };
}

// Check if transaction is in the specified period
function isTransactionInPeriod(transaction, period) {
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    
    if (period === 'month') {
        // This month
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
    } else if (period === 'quarter') {
        // Last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return transactionDate >= threeMonthsAgo;
    } else if (period === 'year') {
        // This year
        return transactionDate.getFullYear() === now.getFullYear();
    }
    
    // All time
    return true;
}

// Update recent transactions table on dashboard
function updateRecentTransactions() {
    const tableBody = document.getElementById('recent-transactions-body');
    tableBody.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Take only the 5 most recent transactions
    const recentTransactions = sortedTransactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'No transactions yet. Add your first transaction!';
        cell.className = 'text-center';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date);
        row.appendChild(dateCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.textContent = transaction.description;
        row.appendChild(descCell);
        
        // Category
        const catCell = document.createElement('td');
        catCell.textContent = transaction.category;
        row.appendChild(catCell);
        
        // Amount
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(transaction.amount);
        amountCell.className = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
        row.appendChild(amountCell);
        
        // Type
        const typeCell = document.createElement('td');
        const typeTag = document.createElement('span');
        typeTag.className = `tag ${transaction.type}`;
        typeTag.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
        typeCell.appendChild(typeTag);
        row.appendChild(typeCell);
        
        tableBody.appendChild(row);
    });
}

// Update all transactions table
function updateTransactionsTable() {
    const tableBody = document.getElementById('transactions-body');
    tableBody.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedTransactions.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No transactions yet. Add your first transaction!';
        cell.className = 'text-center';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date);
        row.appendChild(dateCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.textContent = transaction.description;
        row.appendChild(descCell);
        
        // Category
        const catCell = document.createElement('td');
        catCell.textContent = transaction.category;
        row.appendChild(catCell);
        
        // Amount
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(transaction.amount);
        amountCell.className = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
        row.appendChild(amountCell);
        
        // Type
        const typeCell = document.createElement('td');
        const typeTag = document.createElement('span');
        typeTag.className = `tag ${transaction.type}`;
        typeTag.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
        typeCell.appendChild(typeTag);
        row.appendChild(typeCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function() {
            openTransactionModal(transaction);
        });
        actionsDiv.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this transaction?')) {
                deleteTransaction(transaction.id);
            }
        });
        actionsDiv.appendChild(deleteBtn);
        
        actionsCell.appendChild(actionsDiv);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
    
    // Populate filter category select
    populateFilterCategories();
}

// Populate filter categories
function populateFilterCategories() {
    const filterCategory = document.getElementById('filter-category');
    
    // Clear existing options
    filterCategory.innerHTML = '<option value="all">All Categories</option>';
    
    // Get unique categories from transactions
    const categories = new Set();
    transactions.forEach(transaction => {
        categories.add(transaction.category);
    });
    
    // Add categories to select
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    });
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    
    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update dashboard and transactions table
    updateDashboard();
    updateTransactionsTable();
    updateBudgets();
}

// Update budgets
function updateBudgets() {
    // Update budget overview
    updateBudgetOverview();
    
    // Update budget cards
    updateBudgetCards();
}

// Update budget overview
function updateBudgetOverview() {
    let totalBudget = 0;
    let totalSpent = 0;
    
    budgets.forEach(budget => {
        totalBudget += budget.amount;
        
        // Calculate spending for this budget category
        const spent = calculateBudgetSpending(budget);
        totalSpent += spent;
    });
    
    // Update totals
    document.querySelector('.total-budget').textContent = formatCurrency(totalBudget);
    document.querySelector('.budget-used').textContent = formatCurrency(totalSpent);
    
    // Calculate and update usage rate
    const usageRate = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0;
    document.querySelector('.budget-usage-rate').textContent = `${usageRate}%`;
}

// Update budget cards
function updateBudgetCards() {
    const budgetsContainer = document.getElementById('budgets-container');
    budgetsContainer.innerHTML = '';
    
    if (budgets.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<p>No budgets yet. Create your first budget to start tracking your spending!</p>';
        budgetsContainer.appendChild(emptyState);
        return;
    }
    
    budgets.forEach(budget => {
        // Calculate spending for this budget
        const spent = calculateBudgetSpending(budget);
        const percentage = budget.amount > 0 ? ((spent / budget.amount) * 100) : 0;
        
        // Create budget card
        const budgetCard = document.createElement('div');
        budgetCard.className = 'budget-card';
        
        // Budget header
        const budgetHeader = document.createElement('div');
        budgetHeader.className = 'budget-header';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = budget.category;
        budgetHeader.appendChild(categoryTitle);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function() {
            openBudgetModal(budget);
        });
        actionsDiv.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this budget?')) {
                deleteBudget(budget.id);
            }
        });
        actionsDiv.appendChild(deleteBtn);
        
        budgetHeader.appendChild(actionsDiv);
        budgetCard.appendChild(budgetHeader);
        
        // Budget amount
        const budgetAmount = document.createElement('div');
        budgetAmount.className = 'budget-amount';
        budgetAmount.textContent = formatCurrency(budget.amount);
        budgetCard.appendChild(budgetAmount);
        
        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.className = 'budget-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        
        // Set color based on percentage
        if (percentage < 70) {
            progressBar.classList.add('progress-normal');
        } else if (percentage < 90) {
            progressBar.classList.add('progress-warning');
        } else {
            progressBar.classList.add('progress-danger');
        }
        
        progressContainer.appendChild(progressBar);
        budgetCard.appendChild(progressContainer);
        
        // Budget details
        const budgetDetails = document.createElement('div');
        budgetDetails.className = 'budget-details';
        
        const spentText = document.createElement('span');
        spentText.textContent = `Spent: ${formatCurrency(spent)}`;
        budgetDetails.appendChild(spentText);
        
        const remainingText = document.createElement('span');
        remainingText.textContent = `Remaining: ${formatCurrency(budget.amount - spent)}`;
        budgetDetails.appendChild(remainingText);
        
        budgetCard.appendChild(budgetDetails);
        
        // Period info
        const periodInfo = document.createElement('div');
        periodInfo.className = 'budget-details mt-2';
        periodInfo.innerHTML = `<span>${budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget</span>`;
        budgetCard.appendChild(periodInfo);
        
        budgetsContainer.appendChild(budgetCard);
    });
}

// Calculate spending for a budget
function calculateBudgetSpending(budget) {
    let spent = 0;
    
    // Filter transactions by category and type (expense)
    const categoryTransactions = transactions.filter(t => 
        t.category === budget.category && 
        t.type === 'expense'
    );
    
    // Filter by period
    categoryTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const budgetStartDate = new Date(budget.startDate);
        
        if (budget.period === 'monthly') {
            // Check if transaction is in the same month and year as budget start date
            if (transactionDate.getMonth() === budgetStartDate.getMonth() && 
                transactionDate.getFullYear() === budgetStartDate.getFullYear()) {
                spent += transaction.amount;
            }
        } else if (budget.period === 'yearly') {
            // Check if transaction is in the same year as budget start date
            if (transactionDate.getFullYear() === budgetStartDate.getFullYear()) {
                spent += transaction.amount;
            }
        }
    });
    
    return spent;
}

// Delete budget
function deleteBudget(id) {
    budgets = budgets.filter(b => b.id !== id);
    
    // Save to localStorage
    localStorage.setItem('budgets', JSON.stringify(budgets));
    
    // Update budgets
    updateBudgets();
}

// Update dashboard charts
function updateDashboardCharts() {
    updateMonthlyChart();
    updateCategoryChart();
}

// Update monthly chart
function updateMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    
    // Get data for the past 6 months
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthLabel = `${monthName} ${year}`;
        
        months.push(monthLabel);
        
        // Calculate income and expenses for this month
        const monthIncome = calculateMonthTotal('income', date.getMonth(), date.getFullYear());
        const monthExpense = calculateMonthTotal('expense', date.getMonth(), date.getFullYear());
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
    }
    
    // Create or update chart
    if (window.monthlyChart instanceof Chart) {
        window.monthlyChart.destroy();
    }
    
    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
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
                    beginAtZero: true
                }
            }
        }
    });
}

// Calculate total for a specific month
function calculateMonthTotal(type, month, year) {
    let total = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        if (transaction.type === type && 
            transactionDate.getMonth() === month && 
            transactionDate.getFullYear() === year) {
            total += transaction.amount;
        }
    });
    
    return total;
}

// Update category chart
function updateCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Get expense data by category for the current month
    const categories = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        if (transaction.type === 'expense' && 
            transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
            
            if (!categories[transaction.category]) {
                categories[transaction.category] = 0;
            }
            
            categories[transaction.category] += transaction.amount;
        }
    });
    
    // Prepare data for chart
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    // Generate colors
    const backgroundColors = labels.map((_, index) => {
        return `hsl(${index * (360 / labels.length)}, 70%, 60%)`;
    });
    
    // Create or update chart
    if (window.categoryChart instanceof Chart) {
        window.categoryChart.destroy();
    }
    
    if (labels.length === 0) {
        // No data, show empty chart
        window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e0e0e0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        
        return;
    }
    
    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Set up reports
function setupReports() {
    const periodSelect = document.getElementById('report-period');
    const categorySelect = document.getElementById('report-category');
    
    // Update category select with all categories
    populateCategorySelect(categorySelect, 'expense');
    
    // Add "All Categories" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    categorySelect.insertBefore(allOption, categorySelect.firstChild);
    allOption.selected = true;
    
    // Add income categories
    const optgroup = document.createElement('optgroup');
    optgroup.label = 'Income Categories';
    
    incomeCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = 'income:' + category;
        option.textContent = category;
        optgroup.appendChild(option);
    });
    
    categorySelect.appendChild(optgroup);
}

// Generate report
function generateReport() {
    const period = document.getElementById('report-period').value;
    const category = document.getElementById('report-category').value;
    const reportContainer = document.getElementById('report-results');
    
    // Clear previous report
    reportContainer.innerHTML = '';
    
    // Generate report header
    const header = document.createElement('div');
    header.className = 'report-header';
    
    const title = document.createElement('h3');
    title.textContent = `Financial Report: ${formatReportPeriod(period)}`;
    header.appendChild(title);
    
    reportContainer.appendChild(header);
    
    // Filter transactions
    let filteredTransactions = [...transactions];
    
    // Apply period filter
    if (period !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => isTransactionInPeriod(t, period));
    }
    
    // Apply category filter
    if (category !== 'all') {
        if (category.startsWith('income:')) {
            const incomeCategory = category.split(':')[1];
            filteredTransactions = filteredTransactions.filter(t => 
                t.type === 'income' && t.category === incomeCategory
            );
        } else {
            filteredTransactions = filteredTransactions.filter(t => 
                t.type === 'expense' && t.category === category
            );
        }
    }
    
    // Generate summary
    const summary = document.createElement('div');
    summary.className = 'report-summary';
    
    const totals = calculateTotalsFromTransactions(filteredTransactions);
    
    summary.innerHTML = `
        <div class="summary-item">
            <span>Total Income:</span>
            <span>${formatCurrency(totals.income)}</span>
        </div>
        <div class="summary-item">
            <span>Total Expenses:</span>
            <span>${formatCurrency(totals.expenses)}</span>
        </div>
        <div class="summary-item">
            <span>Net Balance:</span>
            <span>${formatCurrency(totals.balance)}</span>
        </div>
    `;
    
    reportContainer.appendChild(summary);
    
    // Generate charts
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'report-charts';
    
    // Income vs Expenses chart
    const incomeVsExpensesCanvas = document.createElement('canvas');
    incomeVsExpensesCanvas.id = 'income-vs-expenses-chart';
    chartsContainer.appendChild(incomeVsExpensesCanvas);
    
    // Category breakdown chart
    const categoryBreakdownCanvas = document.createElement('canvas');
    categoryBreakdownCanvas.id = 'category-breakdown-chart';
    chartsContainer.appendChild(categoryBreakdownCanvas);
    
    reportContainer.appendChild(chartsContainer);
    
    // Generate detailed transactions table
    const transactionsTable = document.createElement('div');
    transactionsTable.className = 'report-transactions';
    
    const tableTitle = document.createElement('h3');
    tableTitle.textContent = 'Detailed Transactions';
    transactionsTable.appendChild(tableTitle);
    
    const table = document.createElement('table');
    table.className = 'transactions-table';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Type</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    
    // Sort transactions by date (newest first)
    const sortedTransactions = filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedTransactions.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'No transactions found for the selected criteria.';
        cell.className = 'text-center';
        row.appendChild(cell);
        tbody.appendChild(row);
    } else {
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format date
            const dateCell = document.createElement('td');
            dateCell.textContent = formatDate(transaction.date);
            row.appendChild(dateCell);
            
            // Description
            const descCell = document.createElement('td');
            descCell.textContent = transaction.description;
            row.appendChild(descCell);
            
            // Category
            const catCell = document.createElement('td');
            catCell.textContent = transaction.category;
            row.appendChild(catCell);
            
            // Amount
            const amountCell = document.createElement('td');
            amountCell.textContent = formatCurrency(transaction.amount);
            amountCell.className = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
            row.appendChild(amountCell);
            
            // Type
            const typeCell = document.createElement('td');
            const typeTag = document.createElement('span');
            typeTag.className = `tag ${transaction.type}`;
            typeTag.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
            typeCell.appendChild(typeTag);
            row.appendChild(typeCell);
            
            tbody.appendChild(row);
        });
    }
    
    table.appendChild(tbody);
    transactionsTable.appendChild(table);
    
    reportContainer.appendChild(transactionsTable);
    
    // Create charts
    createIncomeVsExpensesChart(filteredTransactions);
    createCategoryBreakdownChart(filteredTransactions);
}

// Calculate totals from filtered transactions
function calculateTotalsFromTransactions(transactions) {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    const balance = totalIncome - totalExpenses;
    
    return {
        income: totalIncome,
        expenses: totalExpenses,
        balance: balance
    };
}

// Create income vs expenses chart
function createIncomeVsExpensesChart(transactions) {
    const ctx = document.getElementById('income-vs-expenses-chart').getContext('2d');
    
    // Group by month
    const monthlyData = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                income: 0,
                expenses: 0
            };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthYear].income += transaction.amount;
        } else {
            monthlyData[monthYear].expenses += transaction.amount;
        }
    });
    
    // Prepare data for chart
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();
    
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1, 1);
        
        labels.push(date.toLocaleString('default', { month: 'short', year: 'numeric' }));
        incomeData.push(monthlyData[month].income);
        expenseData.push(monthlyData[month].expenses);
    });
    
    // Create chart
    new Chart(ctx, {
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
                    beginAtZero: true
                }
            }
        }
    });
}

// Create category breakdown chart
function createCategoryBreakdownChart(transactions) {
    const ctx = document.getElementById('category-breakdown-chart').getContext('2d');
    
    // Group by category
    const categoryData = {};
    
    transactions.forEach(transaction => {
        const category = transaction.category;
        const type = transaction.type;
        const key = `${type}:${category}`;
        
        if (!categoryData[key]) {
            categoryData[key] = 0;
        }
        
        categoryData[key] += transaction.amount;
    });
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    // Sort by amount descending
    const sortedCategories = Object.keys(categoryData).sort((a, b) => categoryData[b] - categoryData[a]);
    
    sortedCategories.forEach((key, index) => {
        const [type, category] = key.split(':');
        labels.push(`${category} (${type.charAt(0).toUpperCase() + type.slice(1)})`);
        data.push(categoryData[key]);
        
        // Color based on type
        const hue = type === 'income' ? 160 : 360;
        backgroundColors.push(`hsl(${hue}, ${70}%, ${60 - (index * 3)}%)`);
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format report period for display
function formatReportPeriod(period) {
    switch (period) {
        case 'month':
            return 'Current Month';
        case 'quarter':
            return 'Last 3 Months';
        case 'year':
            return 'Current Year';
        case 'all':
            return 'All Time';
        default:
            return period;
    }
}

// Export report as PDF
function exportReport() {
    // Create a notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = 'PDF export feature is coming soon!';
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Filter transactions
function filterTransactions() {
    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const searchFilter = document.getElementById('filter-search').value.toLowerCase();
    
    const tableBody = document.getElementById('transactions-body');
    tableBody.innerHTML = '';
    
    // Filter transactions
    let filteredTransactions = [...transactions];
    
    // Apply type filter
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    // Apply search filter
    if (searchFilter) {
        filteredTransactions = filteredTransactions.filter(t => 
            t.description.toLowerCase().includes(searchFilter) ||
            t.category.toLowerCase().includes(searchFilter) ||
            t.notes?.toLowerCase().includes(searchFilter)
        );
    }
    
    // Sort filtered transactions by date (newest first)
    const sortedTransactions = filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedTransactions.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No transactions found matching the filters.';
        cell.className = 'text-center';
        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }
    
    // Render filtered transactions
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(transaction.date);
        row.appendChild(dateCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.textContent = transaction.description;
        row.appendChild(descCell);
        
        // Category
        const catCell = document.createElement('td');
        catCell.textContent = transaction.category;
        row.appendChild(catCell);
        
        // Amount
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(transaction.amount);
        amountCell.className = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
        row.appendChild(amountCell);
        
        // Type
        const typeCell = document.createElement('td');
        const typeTag = document.createElement('span');
        typeTag.className = `tag ${transaction.type}`;
        typeTag.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
        typeCell.appendChild(typeTag);
        row.appendChild(typeCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function() {
            openTransactionModal(transaction);
        });
        actionsDiv.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this transaction?')) {
                deleteTransaction(transaction.id);
            }
        });
        actionsDiv.appendChild(deleteBtn);
        
        actionsCell.appendChild(actionsDiv);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Set up filter event listeners
document.addEventListener('DOMContentLoaded', function() {
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');
    const filterSearch = document.getElementById('filter-search');
    
    filterType.addEventListener('change', filterTransactions);
    filterCategory.addEventListener('change', filterTransactions);
    filterSearch.addEventListener('input', filterTransactions);
    
    // Add clear filter button functionality
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    clearFilterBtn.addEventListener('click', function() {
        filterType.value = 'all';
        filterCategory.value = 'all';
        filterSearch.value = '';
        filterTransactions();
    });
});

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});