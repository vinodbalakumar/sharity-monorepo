import { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, PackageSearch, ReceiptText, WalletCards } from 'lucide-react';
import { Button, Card, EmptyState, LoadingState, StatusBadge } from '../../shared/components/Ui.jsx';
import { adminService } from '../../shared/api/adminService.js';

export function CommercePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [marketplaceDisputes, setMarketplaceDisputes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [blockedPayouts, setBlockedPayouts] = useState([]);
  const [walletAccounts, setWalletAccounts] = useState([]);
  const [walletActivity, setWalletActivity] = useState([]);
  const [gatewayCatalog, setGatewayCatalog] = useState([]);
  const [gatewayPolicies, setGatewayPolicies] = useState([]);
  const [gatewayRecommendation, setGatewayRecommendation] = useState(null);
  const [gatewaySaving, setGatewaySaving] = useState(false);
  const [gatewayCountryCode, setGatewayCountryCode] = useState('US');
  const [gatewayMode, setGatewayMode] = useState('mock');
  const [gatewayActive, setGatewayActive] = useState(true);
  const [gatewayNote, setGatewayNote] = useState('Best default for this country');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [orders, disputes, paymentTransactions, paymentPayouts, payoutHolds, accounts, activity] = await Promise.all([
        adminService.marketplaceOrders().catch(() => []),
        adminService.marketplaceDisputes().catch(() => []),
        adminService.paymentTransactions().catch(() => []),
        adminService.paymentPayouts().catch(() => []),
        adminService.blockedPayouts().catch(() => []),
        adminService.walletAccounts().catch(() => []),
        adminService.walletActivity().catch(() => []),
      ]);
      const [catalog, policies, recommendation] = await Promise.all([
        adminService.paymentGatewayCatalog().catch(() => []),
        adminService.paymentGatewayPolicies().catch(() => []),
        gatewayCountryCode ? adminService.paymentGatewayRecommendation(gatewayCountryCode).catch(() => null) : Promise.resolve(null),
      ]);
      setMarketplaceOrders(orders);
      setMarketplaceDisputes(disputes);
      setTransactions(paymentTransactions);
      setPayouts(paymentPayouts);
      setBlockedPayouts(payoutHolds);
      setWalletAccounts(accounts);
      setWalletActivity(activity);
      setGatewayCatalog(catalog);
      setGatewayPolicies(policies);
      setGatewayRecommendation(recommendation);
      if (recommendation?.gatewayMode) {
        setGatewayMode(recommendation.gatewayMode);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load commerce overview.');
    } finally {
      setLoading(false);
    }
  };

  const saveGatewayPolicy = async () => {
    setGatewaySaving(true);
    setError('');
    try {
      await adminService.upsertPaymentGatewayPolicy(gatewayCountryCode, {
        countryCode: gatewayCountryCode,
        gatewayMode,
        active: gatewayActive,
        recommendationNote: gatewayNote,
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save gateway policy.');
    } finally {
      setGatewaySaving(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState label="Loading commerce overview" />;

  return (
    <div className="page-stack">
      <section className="metric-grid">
        <Card className="metric"><PackageSearch /><span>Marketplace orders</span><strong>{marketplaceOrders.length}</strong></Card>
        <Card className="metric"><AlertTriangle /><span>Disputes</span><strong>{marketplaceDisputes.length}</strong></Card>
        <Card className="metric"><ReceiptText /><span>Transactions</span><strong>{transactions.length}</strong></Card>
        <Card className="metric"><WalletCards /><span>Wallet accounts</span><strong>{walletAccounts.length}</strong></Card>
      </section>

      {error ? <EmptyState title="Commerce overview unavailable" text={error} /> : null}

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Payment gateway policy</h2>
            <span>Choose which mock gateway mode should be used for each country.</span>
          </div>
          <Button type="button" variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
        <div className="grid-two">
          <Card className="surface-card">
            <h3>Gateway selector</h3>
            <div className="form-grid">
              <label>
                Country code
                <input
                  type="text"
                  value={gatewayCountryCode}
                  maxLength={2}
                  onChange={(event) => setGatewayCountryCode(event.target.value.toUpperCase())}
                  placeholder="US"
                />
              </label>
              <label>
                Gateway mode
                <select value={gatewayMode} onChange={(event) => setGatewayMode(event.target.value)}>
                  {gatewayCatalog.map((gateway) => (
                    <option key={gateway.gatewayMode} value={gateway.gatewayMode}>
                      {gateway.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Recommendation note
                <input
                  type="text"
                  value={gatewayNote}
                  onChange={(event) => setGatewayNote(event.target.value)}
                  placeholder="Best default for this country"
                />
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={gatewayActive} onChange={(event) => setGatewayActive(event.target.checked)} />
                Policy active
              </label>
            </div>
            <div className="spacer-16" />
            <Button type="button" disabled={gatewaySaving} onClick={saveGatewayPolicy}>
              {gatewaySaving ? 'Saving...' : 'Save policy'}
            </Button>
          </Card>
          <Card className="surface-card">
            <h3>Current recommendation</h3>
            {gatewayRecommendation ? (
              <div className="stack-gap">
                <p>
                  <strong>{gatewayRecommendation.countryCode}</strong> currently routes to{' '}
                  <strong>{gatewayRecommendation.gatewayMode}</strong>
                </p>
                <p>{gatewayRecommendation.recommendationNote}</p>
                <p>{gatewayRecommendation.policyConfigured ? 'Policy configured' : 'Using default gateway mode'}</p>
              </div>
            ) : (
              <EmptyState title="No recommendation yet" text="Pick a country and load the current gateway recommendation." />
            )}
          </Card>
        </div>
        <div className="spacer-16" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Gateway</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {gatewayCatalog.map((gateway) => (
                <tr key={gateway.gatewayMode}>
                  <td>{gateway.displayName}</td>
                  <td>{gateway.description}</td>
                  <td>{gateway.active ? 'Available' : 'Unavailable'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="spacer-16" />
        {gatewayPolicies.length === 0 ? (
          <EmptyState title="No gateway policies yet" text="Create the first country policy using the selector above." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Gateway</th>
                  <th>Active</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {gatewayPolicies.map((policy) => (
                  <tr key={policy.publicId}>
                    <td>{policy.countryCode}</td>
                    <td>{policy.gatewayMode}</td>
                    <td>{policy.active ? 'Yes' : 'No'}</td>
                    <td>{policy.recommendationNote || 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Marketplace moderation</h2>
            <span>Orders and dispute activity across the commerce platform.</span>
          </div>
          <Button type="button" variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
        {marketplaceOrders.length === 0 ? (
          <EmptyState title="No marketplace orders" text="Published orders will appear here when customers buy listings." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Payment</th>
                  <th>Fulfillment</th>
                  <th>Payout</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {marketplaceOrders.map((order) => (
                  <tr key={order.publicId}>
                    <td>{order.publicId}</td>
                    <td>{order.paymentStatus}</td>
                    <td>{order.fulfillmentStatus}</td>
                    <td>{order.payoutStatus}</td>
                    <td>{order.currencyCode} {order.customerTotalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="spacer-16" />
        <div className="section-head">
          <div>
            <h3>Disputes</h3>
            <span>{marketplaceDisputes.length} disputes ready for review.</span>
          </div>
        </div>
        {marketplaceDisputes.length === 0 ? (
          <EmptyState title="No disputes" text="Disputes will appear here once customers report delivery issues." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dispute</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {marketplaceDisputes.map((disputePublicId) => (
                  <tr key={disputePublicId}>
                    <td>{disputePublicId}</td>
                    <td><StatusBadge value="REVIEW" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Payment and payout visibility</h2>
            <span>Payments, payout holds, and blocked review states.</span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Order</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.publicId}>
                  <td>{transaction.publicId}</td>
                  <td>{transaction.marketplaceOrderPublicId}</td>
                  <td>{transaction.paymentStatus}</td>
                  <td>{transaction.currencyCode} {transaction.customerChargeAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="spacer-16" />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payout</th>
                <th>Order</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {blockedPayouts.map((payout) => (
                <tr key={payout.publicId}>
                  <td>{payout.publicId}</td>
                  <td>{payout.marketplaceOrderPublicId}</td>
                  <td>{payout.payoutStatus}</td>
                  <td>{payout.currencyCode} {payout.amount}</td>
                </tr>
              ))}
              {payouts.filter((payout) => payout.payoutStatus !== 'BLOCKED').map((payout) => (
                <tr key={payout.publicId}>
                  <td>{payout.publicId}</td>
                  <td>{payout.marketplaceOrderPublicId}</td>
                  <td>{payout.payoutStatus}</td>
                  <td>{payout.currencyCode} {payout.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Wallet audit views</h2>
            <span>Ledger projection visibility across currencies and events.</span>
          </div>
        </div>
        <div className="metric-grid">
          {walletAccounts.map((wallet, index) => (
            <div className="metric-card" key={`${wallet.currencyCode}-${index}`}>
              <span>{wallet.currencyCode}</span>
              <strong>{wallet.availableAmount}</strong>
              <small>Available</small>
              <div className="muted-text">Pending {wallet.pendingAmount} / Paid {wallet.paidAmount} / Reversed {wallet.reversedAmount}</div>
            </div>
          ))}
        </div>
        <div className="spacer-16" />
        {walletActivity.length === 0 ? (
          <EmptyState title="No wallet audit records" text="Wallet events will appear here as orders move through the lifecycle." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Entry</th>
                  <th>Type</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {walletActivity.map((entry) => (
                  <tr key={entry.publicId}>
                    <td>{entry.publicId}</td>
                    <td>{entry.entryType}</td>
                    <td>{entry.direction}</td>
                    <td>{entry.entryStatus}</td>
                    <td>{entry.currencyCode} {entry.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
