import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            MultiVend
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            A multi-tenant storefront platform. Create your own branded store,
            add products, and start selling — all in a few minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-black text-white rounded-lg px-6 py-3 font-medium"
            >
              Create your store
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 text-gray-900 rounded-lg px-6 py-3 font-medium bg-white"
            >
              Log in
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-semibold text-gray-900 mb-1">
                Your own storefront
              </h3>
              <p className="text-sm text-gray-600">
                Sign up, set your branding, and get a public store page at
                your own URL.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-semibold text-gray-900 mb-1">
                Sell products
              </h3>
              <p className="text-sm text-gray-600">
                Add products, manage stock, and let shoppers browse, add to
                cart, and check out.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="font-semibold text-gray-900 mb-1">
                Track everything
              </h3>
              <p className="text-sm text-gray-600">
                See your own orders as a store owner, or every store's
                revenue from the admin CRM view.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}