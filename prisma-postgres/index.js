const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a new post
  const newPost = await prisma.post.create({
    data: {
      title: 'My first Post',
      content: 'This is the content of my first post.',
    },
  });

  console.log('Created new post:', newPost);

  // Fetch all posts
  const allPosts = await prisma.post.findMany();
  console.log('All Posts:', allPosts);
}

main()
  .catch(e => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  });