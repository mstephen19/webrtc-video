import { useRef } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();
    const form = useRef<HTMLFormElement>(null);

    return (
        <main>
            <form
                ref={form}
                onSubmit={(e) => {
                    e.preventDefault();
                    // @ts-ignore
                    const room = (form.current!.elements!['room-name'] as HTMLInputElement).value;
                    if (!room) return;
                    router.push(`/${room}`);
                }}>
                <input type='text' name='room-name' />
                <button type='submit'>Join</button>
            </form>
        </main>
    );
}
