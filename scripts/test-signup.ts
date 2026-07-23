import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/auth/signup';

async function testSignup() {
    console.log('--- Starting Signup Tests ---');

    const timestamp = Date.now();
    const newUser = {
        name: 'Test User',
        email: `test${timestamp}@example.com`,
        password: 'password123',
        phone: `123456${timestamp.toString().slice(-4)}`,
        address: '123 Test St',
    };

    // 1. Successful Signup
    try {
        console.log('\nTest 1: Normal Signup');
        const res = await axios.post(BASE_URL, newUser);
        console.log('Result:', res.status, res.data.message);
    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data?.message);
    }

    // 2. Duplicate Email (Different Phone)
    try {
        console.log('\nTest 2: Duplicate Email');
        const duplicateEmail = { ...newUser, phone: '9999999999' };
        const res = await axios.post(BASE_URL, duplicateEmail);
        console.log('Result:', res.status, res.data.message);
    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data?.message);
    }

    // 3. Duplicate Phone (Different Email)
    try {
        console.log('\nTest 3: Duplicate Phone');
        const duplicatePhone = { ...newUser, email: `other${timestamp}@example.com` };
        const res = await axios.post(BASE_URL, duplicatePhone);
        console.log('Result:', res.status, res.data.message);
    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data?.message);
    }

    // 4. Same User (Email & Phone match) - Should succeed (update)
    try {
        console.log('\nTest 4: Same User (Retry)');
        const res = await axios.post(BASE_URL, newUser);
        console.log('Result:', res.status, res.data.message);
    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n--- Tests Completed ---');
}

testSignup();
