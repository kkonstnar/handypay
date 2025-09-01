// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   Dimensions,
//   Share,
//   Clipboard
// } from 'react-native';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../../navigation/RootNavigator';
// import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useUser } from '../../contexts/UserContext';
// import { QRCodeService } from '../../services/QRCodeService';
// import { StripePaymentService } from '../../services/StripePaymentService';
// import Toast from 'react-native-toast-message';
// import { useTransactions } from '../../contexts/TransactionContext';

// export type ScanToPayScreenProps = NativeStackScreenProps<RootStackParamList, 'ScanToPay'>;

// interface ScanToPayParams {
//   paymentLink?: string;
//   amount?: number;
//   currency?: string;
// }

// export default function ScanToPayScreen({ navigation, route }: ScanToPayScreenProps): React.ReactElement {
//   console.log('🏗️ ScanToPayScreen component mounted');

//   const insets = useSafeAreaInsets();
//   const { user } = useUser();
//   const { addTransaction, transactions } = useTransactions();

//   console.log('📊 ScanToPayScreen props:', {
//     amount: route.params?.amount,
//     currency: route.params?.currency,
//     paymentLink: route.params?.paymentLink
//   });

//   // Get params from navigation
//   const params = route.params as ScanToPayParams;
//   const initialPaymentLink = params?.paymentLink;
//   const amount = params?.amount || 0;
//   const currency = params?.currency || 'USD';

//   const [loading, setLoading] = useState(false);
//   const [paymentLink, setPaymentLink] = useState<string>(initialPaymentLink || '');
//   const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [isGenerating, setIsGenerating] = useState(false);

//   // Generate QR code when component mounts or payment link changes
//   useEffect(() => {
//     console.log('🔍 ScanToPayScreen useEffect triggered:', {
//       paymentLink: !!paymentLink,
//       qrCodeDataURL: !!qrCodeDataURL,
//       isGenerating,
//       loading,
//       amount,
//       currency
//     });

//     if (paymentLink && !qrCodeDataURL && !isGenerating && !loading) {
//       console.log('🔄 Auto-generating QR code for payment link:', paymentLink);
//       generateQRCode();
//     } else if (!paymentLink) {
//       console.log('⚠️ No payment link available for QR generation');
//     } else if (qrCodeDataURL) {
//       console.log('✅ QR code already generated');
//     } else if (isGenerating) {
//       console.log('⏳ QR code generation already in progress');
//     }
//   }, [paymentLink]);

//   const generateQRCode = async () => {
//     console.log('🚀 generateQRCode function called');

//     // Prevent multiple concurrent generations
//     if (isGenerating || qrCodeDataURL) {
//       console.log('⏳ QR code generation already in progress or already generated');
//       return;
//     }

//     console.log('✅ Starting QR code generation process');
//     setLoading(true);
//     setError(null);
//     setIsGenerating(true);

//     // Add timeout to prevent infinite loading
//     const timeoutId = setTimeout(() => {
//       console.log('⏰ QR generation timeout reached - this should not happen');
//       setLoading(false);
//       setIsGenerating(false);
//       setError('QR code generation timed out. Please try again.');
//     }, 10000); // 10 second timeout

//     try {
//       console.log('🎨 Generating green QR code for amount:', amount, currency);
//       console.log('👤 User ID:', user?.id);
//       console.log('🔗 Initial payment link:', paymentLink);

//       // If we don't have a payment link yet, create one
//       let linkToUse = paymentLink;

//       if (!linkToUse && user?.id) {
//         console.log('🔗 Creating payment link for QR code...');

//         try {
//           const paymentRequest: any = {
//             handyproUserId: user.id,
//             description: `Payment request for $${amount.toFixed(2)} ${currency}`,
//             amount: StripePaymentService.dollarsToCents(amount),
//             customerName: 'Customer',
//             customerEmail: undefined,
//           };

//           console.log('📡 Sending payment link creation request:', paymentRequest);

//           const paymentResponse = await StripePaymentService.createPaymentLink(paymentRequest);
//           console.log('📡 Payment link creation response:', paymentResponse);

//           if (paymentResponse.payment_link) {
//             linkToUse = paymentResponse.payment_link;
//             setPaymentLink(linkToUse);
//             console.log('✅ Payment link created for QR code:', linkToUse);
//           } else {
//             throw new Error('Failed to create payment link - no payment_link in response');
//           }
//         } catch (paymentError) {
//           console.error('❌ Error creating payment link:', paymentError);
//           // Continue with fallback link for QR generation
//           linkToUse = `https://handypay.com/pay?amount=${amount.toFixed(2)}&currency=${currency}&user=${user.id}&timestamp=${Date.now()}`;
//           setPaymentLink(linkToUse);
//           console.log('🔄 Using fallback link:', linkToUse);
//         }
//       }

//       if (!linkToUse) {
//         throw new Error('Unable to generate payment link - no link available');
//       }

//       console.log('🎨 Generating QR code with link:', linkToUse);
//       console.log('🎨 Calling QRCodeService.generatePaymentLinkQR...');

//       const qrCode = await QRCodeService.generatePaymentLinkQR(
//         linkToUse,
//         amount,
//         currency
//       );

//       console.log('🎨 QRCodeService response:', qrCode);

//       if (qrCode) {
//         setQrCodeDataURL(qrCode);
//         console.log('✅ Green QR code generated successfully');
//         console.log('✅ QR code URL:', qrCode);

//         Toast.show({
//           type: 'success',
//           text1: 'QR Code Generated!',
//           text2: 'Customers can scan to pay instantly'
//         });

//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       } else {
//         throw new Error('QRCodeService returned null/undefined');
//       }
//     } catch (error) {
//       console.error('❌ Error generating QR code:', error);
//       const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
//       setError(errorMessage);

//       Toast.show({
//         type: 'error',
//         text1: 'QR Code Failed',
//         text2: 'Please try again'
//       });

//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//     } finally {
//       clearTimeout(timeoutId);
//       setLoading(false);
//       setIsGenerating(false);
//       console.log('🏁 QR code generation process completed');
//     }
//   };

//   const handleShareQR = async () => {
//     if (!qrCodeDataURL || !paymentLink) return;

//     try {
//       const shareOptions = {
//         message: `Scan this QR code to pay $${amount.toFixed(2)} ${currency}\n\nOr use this link: ${paymentLink}`,
//         url: paymentLink, // iOS will use this
//       };

//       await Share.share(shareOptions);
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

//       // Note: Transaction is created by backend when payment link is generated
//       // No need to create duplicate local transaction

//       Toast.show({
//         type: 'success',
//         text1: 'Shared!',
//         text2: 'QR code shared successfully'
//       });
//     } catch (error) {
//       console.error('Error sharing:', error);
//       Toast.show({
//         type: 'error',
//         text1: 'Share Failed',
//         text2: 'Please try again'
//       });
//     }
//   };

//   const handleCopyLink = async () => {
//     if (!paymentLink) return;

//     try {
//       await Clipboard.setString(paymentLink);
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

//       // Note: Transaction is created by backend when payment link is generated
//       // No need to create duplicate local transaction

//       Toast.show({
//         type: 'success',
//         text1: 'Link Copied!',
//         text2: 'Payment link copied to clipboard'
//       });
//     } catch (error) {
//       console.error('Error copying link:', error);
//       Toast.show({
//         type: 'error',
//         text1: 'Copy Failed',
//         text2: 'Please try again'
//       });
//     }
//   };

//   const handleRegenerateQR = () => {
//     if (paymentLink && !isGenerating) {
//       setQrCodeDataURL(null);
//       setError(null);
//       generateQRCode();
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => {
//             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//             navigation.goBack();
//           }}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="arrow-back" size={24} color="#1F2937" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Scan to Pay</Text>
//         <View style={styles.placeholder} />
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         {/* Amount Display */}
//         <View style={styles.amountContainer}>
//           <Text style={styles.amountLabel}>Payment Amount</Text>
//           <Text style={styles.amountValue}>
//             ${amount.toFixed(2)} {currency}
//           </Text>
//         </View>

//         {/* QR Code Section */}
//         <View style={styles.qrSection}>
//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#3AB75C" />
//               <Text style={styles.loadingText}>Generating QR Code...</Text>
//             </View>
//           ) : error ? (
//             <View style={styles.errorContainer}>
//               <Ionicons name="qr-code-outline" size={64} color="#EF4444" />
//               <Text style={styles.errorText}>{error}</Text>
//               <TouchableOpacity
//                 style={styles.retryButton}
//                 onPress={() => {
//                   console.log('🔄 Manual QR generation retry triggered');
//                   setError(null);
//                   generateQRCode();
//                 }}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.retryText}>Try Again</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.retryButton, { marginTop: 8, backgroundColor: '#6B7280' }]}
//                 onPress={() => {
//                   console.log('🔍 Debug info requested');
//                   console.log('Debug Info:', {
//                     userId: user?.id,
//                     paymentLink,
//                     amount,
//                     currency,
//                     isGenerating,
//                     loading,
//                     qrCodeDataURL: !!qrCodeDataURL
//                   });
//                   Alert.alert('Debug Info', `User: ${user?.id}\nPayment Link: ${!!paymentLink}\nAmount: ${amount}\nGenerating: ${isGenerating}\nLoading: ${loading}\nQR Generated: ${!!qrCodeDataURL}`);
//                 }}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.retryText}>Debug Info</Text>
//               </TouchableOpacity>
//             </View>
//           ) : qrCodeDataURL ? (
//             <View style={styles.qrContainer}>
//               <View style={styles.qrCodeWrapper}>
//                 <img
//                   src={qrCodeDataURL}
//                   alt="Payment QR Code"
//                   style={{
//                     width: '100%',
//                     height: '100%',
//                     borderRadius: 12,
//                   }}
//                 />
//               </View>
//               <Text style={styles.qrDescription}>
//                 Customers can scan this QR code to pay instantly
//               </Text>

//               {/* Action Buttons */}
//               <View style={styles.actionButtons}>
//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.shareButton]}
//                   onPress={handleShareQR}
//                   activeOpacity={0.8}
//                 >
//                   <Ionicons name="share" size={20} color="#3AB75C" />
//                   <Text style={styles.shareButtonText}>Share QR</Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   style={[styles.actionButton, styles.regenerateButton]}
//                   onPress={handleRegenerateQR}
//                   activeOpacity={0.8}
//                 >
//                   <Ionicons name="refresh" size={20} color="#6B7280" />
//                   <Text style={styles.regenerateButtonText}>Regenerate</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.emptyContainer}>
//               <Ionicons name="qr-code-outline" size={64} color="#D1D5DB" />
//               <Text style={styles.emptyText}>No QR Code Generated</Text>
//               <TouchableOpacity
//                 style={styles.generateButton}
//                 onPress={generateQRCode}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.generateButtonText}>Generate QR Code</Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>

//         {/* Payment Link Section */}
//         {paymentLink && (
//           <View style={styles.linkSection}>
//             <Text style={styles.linkTitle}>Payment Link</Text>
//             <TouchableOpacity
//               style={styles.linkContainer}
//               onPress={handleCopyLink}
//               activeOpacity={0.7}
//             >
//               <Text style={styles.linkText} numberOfLines={2}>
//                 {paymentLink}
//               </Text>
//               <Ionicons name="copy" size={20} color="#3AB75C" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Instructions */}
//         <View style={styles.instructions}>
//           <Text style={styles.instructionTitle}>How it works:</Text>
//           <View style={styles.instructionItem}>
//             <Ionicons name="checkmark-circle" size={16} color="#3AB75C" />
//             <Text style={styles.instructionText}>Customer scans QR code</Text>
//           </View>
//           <View style={styles.instructionItem}>
//             <Ionicons name="checkmark-circle" size={16} color="#3AB75C" />
//             <Text style={styles.instructionText}>Payment processed securely</Text>
//           </View>
//           <View style={styles.instructionItem}>
//             <Ionicons name="checkmark-circle" size={16} color="#3AB75C" />
//             <Text style={styles.instructionText}>You receive instant notification</Text>
//           </View>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F8FAFC',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1F2937',
//     fontFamily: 'DMSans-Medium',
//   },
//   placeholder: {
//     width: 40,
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   amountContainer: {
//     alignItems: 'center',
//     paddingVertical: 24,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
//   amountLabel: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 8,
//     fontFamily: 'DMSans-Medium',
//   },
//   amountValue: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#1F2937',
//     fontFamily: 'DMSans-Bold',
//   },
//   qrSection: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#6B7280',
//     fontFamily: 'DMSans-Medium',
//   },
//   errorContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#EF4444',
//     textAlign: 'center',
//     marginTop: 16,
//     marginBottom: 24,
//     fontFamily: 'DMSans-Medium',
//   },
//   retryButton: {
//     backgroundColor: '#3AB75C',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//     fontFamily: 'DMSans-Medium',
//   },
//   qrContainer: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   qrCodeWrapper: {
//     width: 280,
//     height: 280,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 4,
//     marginBottom: 16,
//   },
//   qrDescription: {
//     fontSize: 14,
//     color: '#6B7280',
//     textAlign: 'center',
//     paddingHorizontal: 20,
//     fontFamily: 'DMSans-Medium',
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     marginTop: 24,
//     gap: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     gap: 8,
//   },
//   shareButton: {
//     backgroundColor: '#3AB75C',
//   },
//   shareButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//     fontFamily: 'DMSans-Medium',
//   },
//   regenerateButton: {
//     backgroundColor: '#F3F4F6',
//   },
//   regenerateButtonText: {
//     color: '#6B7280',
//     fontSize: 14,
//     fontWeight: '600',
//     fontFamily: 'DMSans-Medium',
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#6B7280',
//     marginTop: 16,
//     marginBottom: 24,
//     fontFamily: 'DMSans-Medium',
//   },
//   generateButton: {
//     backgroundColor: '#3AB75C',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   generateButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//     fontFamily: 'DMSans-Medium',
//   },
//   linkSection: {
//     marginTop: 20,
//     paddingTop: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#F3F4F6',
//   },
//   linkTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 12,
//     fontFamily: 'DMSans-Medium',
//   },
//   linkContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//     borderRadius: 8,
//     padding: 12,
//     gap: 8,
//   },
//   linkText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#3AB75C',
//     fontFamily: 'DMSans-Medium',
//   },
//   instructions: {
//     marginTop: 24,
//     paddingTop: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#F3F4F6',
//   },
//   instructionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 12,
//     fontFamily: 'DMSans-Medium',
//   },
//   instructionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//     gap: 8,
//   },
//   instructionText: {
//     fontSize: 14,
//     color: '#6B7280',
//     fontFamily: 'DMSans-Medium',
//   },
// });
