'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(id, sku, name, hsn, gstRate, price, qty) {
  return { id, sku, name, hsn, gstRate, price, qty };
}

function checkoutSummary(items, coupon) {
  const totals = pricing.computeTotals(items, coupon);
  return {
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxable: totals.taxable,
    tax: totals.tax,
    cgst: totals.cgst,
    sgst: totals.sgst,
    total: totals.total
  };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: #1001 mixed 18% and 5% items without a coupon',
    order: {
      coupon: '',
      items: [
        item(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 18, 140, 2),
        item(2, 'GRN-002', 'Unpolished Toor Dal 1kg', '0713', 5, 165, 2)
      ]
    },
    checkout: { subtotal: 610, discount: 0, taxable: 610, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9 },
    invoice: {
      subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
      rows: [
        { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 2, price: 140, gstPercent: 18, line: 280, lineTax: 50.4 },
        { name: 'Unpolished Toor Dal 1kg', sku: 'GRN-002', hsn: '0713', qty: 2, price: 165, gstPercent: 5, line: 330, lineTax: 16.5 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 on ₹1,020 subtotal',
    order: {
      coupon: 'SAVE10',
      items: [
        item(1, 'GRN-001', 'Indrayani Basmati Rice 5kg', '1006', 5, 640, 1),
        item(4, 'OIL-001', 'Cold-Pressed Sunflower Oil 1L', '1512', 5, 190, 2)
      ]
    },
    checkout: { subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9 },
    invoice: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      rows: [
        { name: 'Indrayani Basmati Rice 5kg', sku: 'GRN-001', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 28.8 },
        { name: 'Cold-Pressed Sunflower Oil 1L', sku: 'OIL-001', hsn: '1512', qty: 2, price: 190, gstPercent: 5, line: 380, lineTax: 17.1 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 SAVE10 on ₹2,240 subtotal exceeds ₹150 cap',
    order: {
      coupon: 'SAVE10',
      items: [
        item(5, 'OIL-002', 'Cold-Pressed Groundnut Oil 5L', '1508', 5, 1120, 2)
      ]
    },
    checkout: { subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5 },
    invoice: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      rows: [
        { name: 'Cold-Pressed Groundnut Oil 5L', sku: 'OIL-002', hsn: '1508', qty: 2, price: 1120, gstPercent: 5, line: 2240, lineTax: 104.5 }
      ]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: #1008 all 18% items without a coupon',
    order: {
      coupon: '',
      items: [
        item(8, 'BEV-001', 'Assam CTC Masala Chai 250g', '0902', 18, 140, 1),
        item(12, 'BEV-003', 'Kokum Sherbet Concentrate 750ml', '2106', 18, 180, 2)
      ]
    },
    checkout: { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590 },
    invoice: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      rows: [
        { name: 'Assam CTC Masala Chai 250g', sku: 'BEV-001', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
        { name: 'Kokum Sherbet Concentrate 750ml', sku: 'BEV-003', hsn: '2106', qty: 2, price: 180, gstPercent: 18, line: 360, lineTax: 64.8 }
      ]
    }
  }
];

for (const scenario of cases) {
  test(scenario.name, () => {
    const checkout = checkoutSummary(scenario.order.items, scenario.order.coupon);
    const invoiceFigures = invoice.computeInvoiceFigures(scenario.order);

    assert.deepEqual(checkout, scenario.checkout);
    assert.deepEqual(invoiceFigures, scenario.invoice);
  });
}

test('Invoice figures match checkout for capped coupon and HSN GST slab', () => {
  const order = cases[2].order;
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    cgst: checkout.cgst,
    sgst: checkout.sgst,
    total: checkout.total,
    rows: [
      {
        name: 'Cold-Pressed Groundnut Oil 5L',
        sku: 'OIL-002',
        hsn: '1508',
        qty: 2,
        price: 1120,
        gstPercent: 5,
        line: 2240,
        lineTax: 104.5
      }
    ]
  });
});
