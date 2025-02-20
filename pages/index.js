import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', textAlign: 'center', padding: '2rem' }}>
      <h1>Welcome to My Web App</h1>
      <p>Navigate to the following pages:</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ margin: '1rem 0' }}>
          <Link href="/login">
            <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Login</span>
          </Link>
        </li>
        <li style={{ margin: '1rem 0' }}>
          <Link href="/signup">
            <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Sign Up</span>
          </Link>
        </li>
        <li style={{ margin: '1rem 0' }}>
          <Link href="/submit-form">
            <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Submit Form</span>
          </Link>
        </li>
        <li style={{ margin: '1rem 0' }}>
          <Link href="/topup">
            <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Top Up</span>
          </Link>
        </li>
      </ul>
      <p>Start exploring the app by clicking on any link above!</p>
    </div>
  );
}