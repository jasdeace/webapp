import Link from 'next/link';
import AuthenticatedLayout from '../components/AuthenticatedLayout'; // Adjust path if needed

export default function Home() {
  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto text-center p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to My Web App</h1>
        <p className="mb-6">Navigate to the following pages:</p>
        <ul className="list-none p-0">
          <li className="my-4">
            <Link href="/login">
              <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">Login</span>
            </Link>
          </li>
          <li className="my-4">
            <Link href="/signup">
              <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">Sign Up</span>
            </Link>
          </li>
          <li className="my-4">
            <Link href="/submit-form">
              <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">Submit Form</span>
            </Link>
          </li>
          <li className="my-4">
            <Link href="/topup">
              <span className="text-blue-600 underline cursor-pointer hover:text-blue-800">Top Up</span>
            </Link>
          </li>
        </ul>
        <p className="mt-6">Start exploring the app by clicking on any link above!</p>
      </div>
    </AuthenticatedLayout>
  );
}