import * as dotenv from 'dotenv';
dotenv.config();

import AWS from 'aws-sdk';
import { MoreThan } from 'typeorm';
import { AppDataSource } from './database/configuration/db-data-source';
import { Trekking } from './entities/trekking';
import { Group } from './entities/group';
import { User } from './entities/user';
import { GroupStatusEnum } from './enums/group-status.enum';

AWS.config.update({
  region: process.env.AWS_REGION
});

let ses = new AWS.SES();

const sendEmail = async () => {
  if (!AppDataSource.isConnected) {
    await AppDataSource.initialize();
  }

  const groupRepository = AppDataSource.getRepository(Group);
  const trekkingRepository = AppDataSource.getRepository(Trekking);

  const groups = await groupRepository.find({
    where: {
      groupStatus: {
        id: GroupStatusEnum.WaitingTouristGuide
      }
    },
    relations: {
      groupStatus: true,
      trekking: true,
      lastTouristGuideInvited: true
    }
  });

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const trekking = await trekkingRepository.findOneOrFail({
      where: {
        id: group.trekking.id,
        touristGuides: {
          id: MoreThan(group.lastTouristGuideInvited?.id || 0)
        }
      },
      relations: {
        touristGuides: true
      }
    });

    if (trekking.touristGuides.length > 0) {
      let emailParams: AWS.SES.SendEmailRequest = {
        Destination: {
          ToAddresses: [trekking.touristGuides[0].email]
        },
        Message: {
          Body: {
            Text: {
              Data: 'Você foi convidado para guiar no trekking ${group.trekking.name} no dia ${group.date}. Confirme em até 24hrs através do link Quero guiar',
              Charset: 'UTF-8'
            }
          },
          Subject: {
            Data: 'Convite para guiar trekking',
            Charset: 'UTF-8'
          }
        },
        Source: process.env.SENDER_EMAIL || ''
      };

      await ses.sendEmail(emailParams).promise();

      group.lastTouristGuideInvited = trekking.touristGuides[0];
      await groupRepository.save(group);

      console.log('>>> E-mail sent:', group, trekking.touristGuides[0]);
    }
  }
};

const myHandler = async () => {
  try {
    const results = await sendEmail();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Sent invites'
      })
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Some error happened'
      })
    };
  }
};

module.exports.handler = myHandler;
