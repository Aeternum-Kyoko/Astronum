import BlogEditor from "@/components/BlogEditor";

export default function NewPostPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-2xl text-cream md:text-3xl">New Post</h1>
      <div className="mt-8">
        <BlogEditor />
      </div>
    </section>
  );
}
