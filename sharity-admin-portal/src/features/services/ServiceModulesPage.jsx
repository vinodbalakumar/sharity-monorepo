import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, AppWindow, ExternalLink, Gauge, PackageCheck, RefreshCw, Store, Wallet } from 'lucide-react';
import { Button, EmptyState, LoadingState, StatusBadge } from '../../shared/components/Ui.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { launchServiceModule } from '../../shared/utils/serviceLauncher.js';
import { adminService } from '../../shared/api/adminService.js';
import { apiErrorMessage } from '../../shared/utils/apiError.js';

const moduleIcons = {
  MARKETPLACE: Store,
  WALLET: Wallet,
  PAYMENTS: AppWindow,
  TESLA_DASHBOARD: Gauge,
};

const routeForModule = (module) => {
  if (module.moduleCode === 'TESLA_DASHBOARD') return import.meta.env.VITE_TESLA_APP_URL || '/tesla/';
  if (module.frontendRoute) return module.frontendRoute;
  return null;
};

export function ServiceModulesPage() {
  const { applications, user } = useAuth();
  const [modules, setModules] = useState([]);
  const [providers, setProviders] = useState([]);
  const [countries, setCountries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [blockedPayouts, setBlockedPayouts] = useState([]);
  const [walletAccounts, setWalletAccounts] = useState([]);
  const [walletActivity, setWalletActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const canAccessAll = applications.includes('*');
  const visibleModules = useMemo(
    () => modules.filter((module) => canAccessAll || applications.includes(module.moduleCode)),
    [applications, canAccessAll, modules],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [moduleData, providerData, countryData, orderData, disputeData, transactionData, payoutData, blockedPayoutData, walletAccountData, walletData] =
        await Promise.all([
          adminService.modules(),
          adminService.pendingProviders().catch(() => []),
          adminService.supportedCountries().catch(() => []),
          adminService.marketplaceOrders().catch(() => []),
          adminService.marketplaceDisputes().catch(() => []),
          adminService.paymentTransactions().catch(() => []),
          adminService.paymentPayouts().catch(() => []),
          adminService.blockedPayouts().catch(() => []),
          adminService.walletAccounts().catch(() => []),
          adminService.walletActivity().catch(() => []),
        ]);
      setModules(moduleData);
      setProviders(providerData);
      setCountries(countryData);
      setOrders(orderData);
      setDisputes(disputeData);
      setTransactions(transactionData);
      setPayouts(payoutData);
      setBlockedPayouts(blockedPayoutData);
      setWalletAccounts(walletAccountData);
      setWalletActivity(walletData);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, 'Unable to load admin operations.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approveMarketplace = async (providerPublicId) => {
    setBusyAction(`provider-${providerPublicId}`);
    try {
      await adminService.updateProviderModuleStatus(providerPublicId, 'MARKETPLACE', {
        enrollmentStatus: 'APPROVED',
        sellingEnabled: true,
        serviceEnabled: true,
        payoutEligible: true,
        disabledReason: '',
      });
      await load();
    } catch (actionError) {
      setError(apiErrorMessage(actionError, 'Unable to approve provider.'));
    } finally {
      setBusyAction('');
    }
  };

  const recordDisputeDecision = async (disputePublicId) => {
    setBusyAction(`dispute-${disputePublicId}`);
    try {
      await adminService.marketplaceDisputeDecision(disputePublicId);
      await load();
    } catch (actionError) {
      setError(apiErrorMessage(actionError, 'Unable to record dispute decision.'));
    } finally {
      setBusyAction('');
    }
  };

  if (loading) return <LoadingState label="Loading service modules" />;

  return (
    <div className="page-stack">
      <section className="metric-grid">
        <div className="metric-card">
          <span>Modules</span>
          <strong>{modules.length}</strong>
        </div>
        <div className="metric-card">
          <span>Provider approvals</span>
          <strong>{providers.length}</strong>
        </div>
        <div className="metric-card">
          <span>Countries</span>
          <strong>{countries.length}</strong>
        </div>
        <div className="metric-card">
          <span>Payment transactions</span>
          <strong>{transactions.length}</strong>
        </div>
      </section>

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Service modules</h2>
            <span>Open connected Sharity business applications.</span>
          </div>
          <Button type="button" variant="secondary" onClick={load}>
            <RefreshCw size={17} />
            Refresh
          </Button>
        </div>
        {error ? (
          <EmptyState title="Modules unavailable" text={error} />
        ) : visibleModules.length === 0 ? (
          <EmptyState title="No modules assigned" text="" />
        ) : (
          <div className="service-grid">
            {visibleModules.map((module) => {
              const Icon = moduleIcons[module.moduleCode] || PackageCheck;
              const route = routeForModule(module);
              const disabled = module.status !== 'ACTIVE' || !route;
              return (
                <article className={`service-card ${disabled ? 'is-disabled' : ''}`} key={module.moduleCode}>
                  <div className="service-icon"><Icon size={22} /></div>
                  <div>
                    <span>{module.moduleCode}</span>
                    <h3>{module.moduleName}</h3>
                    <p>{module.description}</p>
                    <small>{module.status}</small>
                  </div>
                  <Button type="button" disabled={disabled} onClick={() => launchServiceModule(route, user)}>
                    <ExternalLink size={17} />
                    Open
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Provider approvals</h2>
            <span>Approve Marketplace providers and review enrollment state.</span>
          </div>
        </div>
        {providers.length === 0 ? (
          <EmptyState title="No pending providers" text="Provider approvals will appear here when pending records exist." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Marketplace</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => {
                  const marketplace = provider.enrollments?.find((item) => item.moduleCode === 'MARKETPLACE');
                  return (
                    <tr key={provider.publicId}>
                      <td>
                        <strong>{provider.displayName}</strong>
                        <div className="muted-text">{provider.providerType}</div>
                      </td>
                      <td>{provider.countryCode}</td>
                      <td><StatusBadge value={provider.overallStatus} /></td>
                      <td>
                        {marketplace ? (
                          <div>
                            <div>{marketplace.enrollmentStatus}</div>
                            <div className="muted-text">
                              selling {marketplace.sellingEnabled ? 'enabled' : 'disabled'}
                            </div>
                          </div>
                        ) : (
                          <span className="muted-text">No Marketplace enrollment</span>
                        )}
                      </td>
                      <td>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busyAction === `provider-${provider.publicId}`}
                          onClick={() => approveMarketplace(provider.publicId)}
                        >
                          {busyAction === `provider-${provider.publicId}` ? 'Saving...' : 'Approve Marketplace'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Marketplace moderation</h2>
            <span>Review orders and dispute placeholders from the marketplace service.</span>
          </div>
        </div>
        {orders.length === 0 ? (
          <EmptyState title="No marketplace orders" text="" />
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
                {orders.map((order) => (
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
            <span>{disputes.length} dispute placeholders available for review.</span>
          </div>
        </div>
        {disputes.length === 0 ? (
          <EmptyState title="No disputes" text="" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dispute public id</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {disputes.map((disputePublicId) => (
                  <tr key={disputePublicId}>
                    <td>{disputePublicId}</td>
                    <td>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyAction === `dispute-${disputePublicId}`}
                        onClick={() => recordDisputeDecision(disputePublicId)}
                      >
                        {busyAction === `dispute-${disputePublicId}` ? 'Saving...' : 'Record decision'}
                      </Button>
                    </td>
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
            <h2>Payment transactions and payout holds</h2>
            <span>Transaction visibility and blocked payout review.</span>
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
            <span>Ledger projection visibility from wallet-service.</span>
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
          <EmptyState title="No wallet audit records" text="" />
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
