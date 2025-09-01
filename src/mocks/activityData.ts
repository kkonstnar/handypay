import { Transaction } from '../contexts/TransactionContext';

export const sampleTransactions: Transaction[] = [
  {
    id: '1',
    type: 'received',
    amount: 45.67,
    description: 'QR Code Payment',
    merchant: 'Coffee Shop',
    date: new Date('2024-01-12T14:30:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '2',
    type: 'received',
    amount: 125.00,
    description: 'Payment Link',
    merchant: 'Online Store',
    date: new Date('2024-01-12T09:15:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '3',
    type: 'received',
    amount: 12.50,
    description: 'QR Code Payment',
    merchant: 'McDonald\'s',
    date: new Date('2024-01-11T13:45:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '4',
    type: 'received',
    amount: 50.00,
    description: 'Payment Link',
    merchant: 'Service Provider',
    date: new Date('2024-01-11T10:20:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '5',
    type: 'received',
    amount: 35.20,
    description: 'QR Code Payment',
    merchant: 'Shell Gas Station',
    date: new Date('2024-01-10T16:30:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '6',
    type: 'received',
    amount: 200.00,
    description: 'Payment Link',
    merchant: 'Freelance Work',
    date: new Date('2024-01-10T11:00:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '7',
    type: 'received',
    amount: 89.99,
    description: 'Payment Link',
    merchant: 'Amazon Purchase',
    date: new Date('2024-01-09T20:15:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '8',
    type: 'received',
    amount: 25.00,
    description: 'QR Code Payment',
    merchant: 'Pizza Palace',
    date: new Date('2024-01-09T14:20:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '9',
    type: 'received',
    amount: 15.75,
    description: 'QR Code Payment',
    merchant: 'Cinema Plus',
    date: new Date('2024-01-08T19:30:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '10',
    type: 'received',
    amount: 67.45,
    description: 'Payment Link',
    merchant: 'Whole Foods',
    date: new Date('2024-01-08T15:10:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '11',
    type: 'received',
    amount: 25.99,
    description: 'Payment Link',
    merchant: 'Amazon',
    date: new Date('2024-01-07T14:22:00'),
    status: 'pending',
    paymentMethod: 'payment_link'
  },
  {
    id: '12',
    type: 'received',
    amount: 100.00,
    description: 'QR Code Payment',
    merchant: 'Restaurant',
    date: new Date('2024-01-06T18:45:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '13',
    type: 'received',
    amount: 250.00,
    description: 'Payment Link',
    merchant: 'Consulting Service',
    date: new Date('2024-01-15T10:00:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '14',
    type: 'received',
    amount: 180.50,
    description: 'QR Code Payment',
    merchant: 'Retail Store',
    date: new Date('2024-01-14T14:30:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '15',
    type: 'received',
    amount: 420.75,
    description: 'Payment Link',
    merchant: 'E-commerce',
    date: new Date('2024-01-10T09:15:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  },
  {
    id: '16',
    type: 'received',
    amount: 125.25,
    description: 'QR Code Payment',
    merchant: 'Local Business',
    date: new Date('2024-01-08T16:45:00'),
    status: 'completed',
    paymentMethod: 'qr_code'
  },
  {
    id: '17',
    type: 'received',
    amount: 315.80,
    description: 'Payment Link',
    merchant: 'Digital Service',
    date: new Date('2024-01-03T11:20:00'),
    status: 'completed',
    paymentMethod: 'payment_link'
  }
];