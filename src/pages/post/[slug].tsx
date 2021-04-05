import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

import Header from '../../components/Header'

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const postToText = post.data.content.map(content => {
    return content.body.map(body => body.text).join(" ")
  }).join(" ")

  const words = postToText.split(" ").length

  const readingTime = Math.ceil(words / 200)

  return (
    <>
      <Head>
        <title>{post.data.title} | spacenews</title>
      </Head>

      <main>
        <Header />

        {post.data.content.map(section => {
          const html = RichText.asHtml(section.body)

          return (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </section>
          )
        })}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at("document.type", "posts")
  ], {
    fetch: "posts.slug"
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID("posts", String(params.slug), {});

  const post: Post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      "dd MMM yyyy",
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content
    }
  }

  return {
    props: { post }
  }
};
