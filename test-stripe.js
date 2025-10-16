// Script de test des clés Stripe
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;

console.log('🔑 Stripe Secret Key:', stripeKey ? `${stripeKey.substring(0, 20)}...` : 'NOT FOUND');
console.log('🌐 NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL);

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

async function testStripe() {
  try {
    console.log('\n📊 Test 1: Récupération des informations du compte...');
    const account = await stripe.account.retrieve();
    console.log('✅ Compte Stripe connecté:', account.id);
    console.log('   - Email:', account.email);
    console.log('   - Pays:', account.country);
    
    console.log('\n📊 Test 2: Création d\'une session Checkout de test...');
    const baseUrl = process.env.NEXT_PUBLIC_URL?.replace(/\/dashboard$/, '') || 'http://localhost:3001';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Test - Génération d\'image IA',
              description: 'Ceci est un test',
            },
            unit_amount: 200, // 2.00 EUR
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        project_id: 'test-project-123',
        user_id: 'test-user-456',
      },
    });
    
    console.log('✅ Session Checkout créée avec succès!');
    console.log('   - Session ID:', session.id);
    console.log('   - URL:', session.url);
    console.log('   - Success URL:', `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`);
    console.log('   - Cancel URL:', `${baseUrl}/dashboard?canceled=true`);
    
    console.log('\n✅ Tous les tests Stripe ont réussi! 🎉');
    
  } catch (error) {
    console.error('\n❌ Erreur Stripe:', error.message);
    console.error('   - Type:', error.type);
    console.error('   - Code:', error.code);
    if (error.raw) {
      console.error('   - Raw message:', error.raw.message);
    }
    process.exit(1);
  }
}

testStripe();
