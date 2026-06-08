const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const generateTemplate = () => {
  const data = [
    {
      emp_id: 'EMP1001',
      name: 'Amit Patel',
      phone: '+919876543210',
      email: 'amit.patel@company.com',
      department: 'Engineering',
      designation: 'Senior Developer'
    },
    {
      emp_id: 'EMP1002',
      name: 'Sneha Rao',
      phone: '+918765432109',
      email: 'sneha.rao@company.com',
      department: 'Human Resources',
      designation: 'HR Coordinator'
    },
    {
      emp_id: 'EMP1003',
      name: 'Vikram Singh',
      phone: '+917654321098',
      email: 'vikram.singh@company.com',
      department: 'Marketing',
      designation: 'Marketing Lead'
    }
  ];

  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Employees');

  const outputPath = path.join(__dirname, '../employees.xlsx');
  xlsx.writeFile(wb, outputPath);
  
  console.log(`\n==================================================`);
  console.log(`TEST EXCEL TEMPLATE CREATED SUCCESSFULLY!`);
  console.log(`Path: ${outputPath}`);
  console.log(`Contains: ${data.length} test records (EMP1001, EMP1002, EMP1003)`);
  console.log(`==================================================\n`);
};

// Ensure directory exists
const dir = path.dirname(path.join(__dirname, '../employees.xlsx'));
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

generateTemplate();
