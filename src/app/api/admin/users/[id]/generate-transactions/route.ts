import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { authenticateAdmin } from '@/lib/auth';
import { successResponse, errorResponse, handleError } from '@/lib/apiResponse';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { TransactionType, TransactionStatus } from '@/types';
import { generateReference } from '@/lib/utils';

// International banks for random selection
const BANKS = [
  { name: 'JPMorgan Chase', address: '270 Park Avenue, New York, NY, USA' },
  { name: 'Bank of America', address: '100 N Tryon St, Charlotte, NC, USA' },
  { name: 'HSBC', address: '8 Canada Square, London, UK' },
  { name: 'Barclays', address: '1 Churchill Place, London, UK' },
  { name: 'Deutsche Bank', address: 'Taunusanlage 12, Frankfurt, Germany' },
  { name: 'Standard Chartered', address: '1 Basinghall Avenue, London, UK' },
  { name: 'Citibank', address: '388 Greenwich Street, New York, NY, USA' },
  { name: 'UBS', address: 'Bahnhofstrasse 45, Zurich, Switzerland' },
  { name: 'Santander', address: 'Av. de Cantabria, Boadilla del Monte, Spain' },
  { name: 'Wells Fargo', address: '420 Montgomery Street, San Francisco, CA, USA' },
];

// Realistic names for random selection
const NAMES = [
  'Alexander Hamilton',
  'Sophia Laurent',
  'Liam Bennett',
  'Isabella Carter',
  'Ethan Montgomery',
  'Amelia Sinclair',
  'Noah Fitzgerald',
  'Charlotte Windsor',
  'Benjamin Harrington',
  'Olivia Kensington',
];

// Payment modes
const PAYMENT_MODES = ['Local Transfer', 'International Transfer', 'Crypto Deposit', 'Check Deposit'];

// Random descriptions
const DESCRIPTIONS = [
  'Payment for services rendered',
  'Invoice settlement',
  'Salary payment',
  'Online purchase refund',
  'Loan repayment',
  'Investment deposit',
  'Transfer to savings account',
  'Bill payment',
  'Cryptocurrency exchange',
  'Payment received from client',
];

// Transaction types for random selection
const TRANSACTION_TYPES = [TransactionType.DEPOSIT, TransactionType.WITHDRAWAL];

// Helper function to get random element from array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number between min and max
function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Helper function to get random date between two dates
function getRandomDate(startDate: Date, endDate: Date): Date {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();
  const randomTimestamp = startTimestamp + Math.random() * (endTimestamp - startTimestamp);
  return new Date(randomTimestamp);
}

// Helper function to generate random account number
function generateRandomAccountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Verify admin token
    const { admin, error } = await authenticateAdmin(request);
    if (!admin || error) {
      return errorResponse(error || 'Unauthorized', 401);
    }

    const { id: userId } = await params;
    const body = await request.json();
    
    const {
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      numberOfTransactions,
    } = body;

    // Validate required fields
    if (!minAmount || !maxAmount || !fromDate || !toDate || !numberOfTransactions) {
      return errorResponse('All fields are required: minAmount, maxAmount, fromDate, toDate, numberOfTransactions', 400);
    }

    // Validate amounts
    if (minAmount < 0) {
      return errorResponse('Minimum amount cannot be negative', 400);
    }
    if (maxAmount <= minAmount) {
      return errorResponse('Maximum amount must be greater than minimum amount', 400);
    }

    // Validate dates
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    if (endDate < startDate) {
      return errorResponse('End date must be after start date', 400);
    }

    // Validate number of transactions
    if (numberOfTransactions < 1 || numberOfTransactions > 200) {
      return errorResponse('Number of transactions must be between 1 and 200', 400);
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    let currentBalance = user.balance;
    const generatedTransactions = [];

    for (let i = 0; i < numberOfTransactions; i++) {
      // Generate random values
      const randomDate = getRandomDate(startDate, endDate);
      const randomAmount = Math.round(getRandomNumber(minAmount, maxAmount) * 100) / 100;
      const randomPaymentMode = getRandomElement(PAYMENT_MODES);
      const randomName = getRandomElement(NAMES);
      const randomBank = getRandomElement(BANKS);
      const randomDescription = getRandomElement(DESCRIPTIONS);
      const transactionType = getRandomElement(TRANSACTION_TYPES);

      // Calculate balance before and after
      const balanceBefore = currentBalance;
      let balanceAfter: number;

      // Force deposit if a withdrawal would make balance negative
      const effectiveType =
        transactionType === TransactionType.WITHDRAWAL && balanceBefore < randomAmount
          ? TransactionType.DEPOSIT
          : transactionType;

      if (effectiveType === TransactionType.DEPOSIT) {
        balanceAfter = balanceBefore + randomAmount;
      } else {
        balanceAfter = balanceBefore - randomAmount;
      }

      // Update current balance for next iteration
      currentBalance = balanceAfter;

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        type: effectiveType,
        amount: randomAmount,
        balanceBefore,
        balanceAfter,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        description: randomDescription,
        reference: generateReference('TXN'),
        metadata: {
          source: 'admin_generated',
          paymentMode: randomPaymentMode,
          counterpartyName: randomName,
          counterpartyBank: randomBank.name,
          counterpartyBankAddress: randomBank.address,
          counterpartyAccountNumber: generateRandomAccountNumber(),
        },
        createdAt: randomDate,
        updatedAt: randomDate,
      });

      await transaction.save();
      generatedTransactions.push(transaction);
    }

    // Update user's final balance
    user.balance = currentBalance;
    await user.save();

    return successResponse(
      {
        transactionsGenerated: generatedTransactions.length,
        newBalance: currentBalance,
      },
      `${numberOfTransactions} transactions generated successfully`
    );
  } catch (error) {
    return handleError(error);
  }
}
