// @flow
import * as React from "react";
import { api } from '../../config'
import Page, { SectionHeading, Heading, Subheading } from '../../components/Page'
import type { ConfigPodcast, SimplecastPodcast, SimplecastEpisode, GetInitialProps } from '../../types'
import EpisodeView from '../../components/EpisodeView'
import PodcastsGrid from '../../components/PodcastsGrid'
import PodcastView from "../../components/PodcastView";
import sortPodcasts from '../../lib/scToConfigPodcasts'

type Props = {
  podcast: ?SimplecastPodcast,
  podcasts: ?Array<ConfigPodcast>,
  episode: SimplecastEpisode,
  episodes: ?Array<SimplecastEpisode>
}

class Episode extends React.Component<Props> {
  static async getInitialProps({ query, res }: GetInitialProps) {
    let podcast, episode, podcasts, episodes

    if (query.slug && query.episodeId) {
      // match a slug to a podcast record in our config
      const configPodcast = api.getConfigPodcastFromSlug(query.slug)

      if (configPodcast && configPodcast.simplecastId) {
        // as long as the slug returns a valid config podcast, fetch the 
        // show from the api
        [
          podcast,
          episode
        ] = await Promise.all([
          api.getPodcast(configPodcast.simplecastId),
          api.getEpisode(configPodcast.simplecastId, parseInt(query.episodeId))
        ])
      }
    }

    if (!podcast) {
      const results = await api.getPodcasts()
      podcasts = sortPodcasts(results)
    }

    if (podcast && episode && episode.error) {
      episodes = await api.getEpisodes(podcast.id)
    }

    if (podcast && episode && !episode.published) {
      episodes = await api.getEpisodes(podcast.id)
    }

    if (podcast && episode && episode.published) {
      if (res) {
        // cache episodes for a day
        const cacheAge = 60 * 60 * 24 * 7
        res.setHeader('Cache-Control', `public,s-maxage=${cacheAge}`)
      }
    }

    return { podcast, episode, podcasts, episodes };
  }

  render() {
    const { podcast, episode, podcasts, episodes } = this.props

    if (podcast) {
      const configPodcast = api.getConfigPodcastFromId(podcast.id)
      
      if (configPodcast) {
        return (
          <Page>

            {
              episode && !episode.error && episode.published
              ? <EpisodeView podcast={configPodcast} episode={episode} />
              : <PodcastView podcast={configPodcast} episodes={episodes} />
            }
            
          </Page>
        )
      }

      return null
    } 

    return (
      <Page dataCy={'invalid-episode-view'}>
        <SectionHeading>
          <Heading>Podcasts</Heading>
          <Subheading>Level up by listening to podcasts from the best in the industry</Subheading>
        </SectionHeading>

        {
          podcasts &&
          <PodcastsGrid podcasts={podcasts} />
        }
      </Page>
    )
  }
}

export default Episode;
