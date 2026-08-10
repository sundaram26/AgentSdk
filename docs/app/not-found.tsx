import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Return Home
      </Link>
    </div>
  );
}
